import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import Borrow from 'components/borrow'
import SomeError from 'components/layout/error'
import Offers from 'components/offers'
import { fetchOffers } from 'lib/api'
import { Offer, Outcome, Tasks } from 'lib/types'
import Spinner from 'components/spinner'
import { ContractsContext } from 'components/providers/contracts'
import Channel from 'components/channel'
import EnablersLiquid from 'components/enablers/liquid'
import EnablersLightning from 'components/enablers/lightning'
import { ModalStages } from 'components/modals/modal'
import { randomBytes } from 'crypto'
import { feeAmount } from 'lib/constants'
import { saveContractToStorage } from 'lib/contracts'
import {
  prepareBorrowTxWithClaimTx,
  proposeBorrowContract,
  prepareBorrowTx,
} from 'lib/covenant'
import { broadcastTx, signAndBroadcastTx } from 'lib/marina'
import { createReverseSubmarineSwap, waitForLightningPayment } from 'lib/swaps'
import { openModal, extractError } from 'lib/utils'
import { Psbt, witnessStackToScriptWitness } from 'liquidjs-lib'
import ECPairFactory from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import { WalletContext } from 'components/providers/wallet'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import LightningDepositModal from 'components/modals/lightningDeposit'

const BorrowTicker: NextPage = () => {
  const { network } = useContext(WalletContext)
  const { newContract, oracles, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [offers, setOffers] = useState<Offer[]>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [invoice, setInvoice] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const router = useRouter()
  const { params } = router.query

  const handleInvoice = async (): Promise<void> => {
    openModal('lightning-deposit-modal')
    setStage(ModalStages.NeedsInvoice)
    try {
      // create ephemeral account
      const privateKey = randomBytes(32)
      const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

      // give enough satoshis to pay for all fees expected, so that we
      // can use the returning coin as a solo input for the borrow tx
      if (!newContract?.collateral.quantity) return
      const onchainAmount = newContract.collateral.quantity + feeAmount

      // create swap with Boltz.exchange
      const boltzSwap = await createReverseSubmarineSwap(
        keyPair.publicKey,
        network,
        onchainAmount,
      )
      if (!boltzSwap) throw new Error('Error creating swap')

      // deconstruct swap
      const { invoice, lockupAddress, preimage, redeemScript } = boltzSwap

      // show qr code to user
      setInvoice(invoice)
      setStage(ModalStages.NeedsPayment)

      // wait for payment
      const utxos = await waitForLightningPayment(
        invoice,
        lockupAddress,
        network,
      )

      // payment was never made, and the invoice expired
      if (utxos.length === 0) throw new Error('Invoice has expired')

      // show user (via modal) that payment was received
      setInvoice('')
      setStage(ModalStages.NeedsFujiApproval)

      // prepare borrow transaction with claim utxo as input
      const preparedTx = await prepareBorrowTxWithClaimTx(
        newContract,
        network,
        redeemScript,
        utxos,
      )

      // propose contract to alpha factory
      const { partialTransaction } = await proposeBorrowContract(preparedTx)

      // sign and finalize input[0]
      const psbt = Psbt.fromBase64(partialTransaction)
      psbt.signInput(0, keyPair)
      psbt.finalizeInput(0, (_, input) => {
        return {
          finalScriptSig: undefined,
          finalScriptWitness: witnessStackToScriptWitness([
            input.partialSig![0].signature,
            preimage,
            Buffer.from(redeemScript, 'hex'),
          ]),
        }
      })

      setStage(ModalStages.NeedsFinishing)

      // broadcast transaction
      newContract.txid = await broadcastTx(psbt.toBase64())

      // add vout to contract
      newContract.vout = 0

      // add additional fields to contract and save to storage
      await saveContractToStorage(newContract, network, preparedTx)

      // show success
      setData(newContract.txid)
      setResult(Outcome.Success)
      reloadContracts()
    } catch (error) {
      setData(extractError(error))
      setResult(Outcome.Failure)
    }
  }

  const handleMarina = async (): Promise<void> => {
    openModal('marina-deposit-modal')
    setStage(ModalStages.NeedsCoins)
    try {
      if (!newContract) return

      // prepare borrow transaction
      const preparedTx = await prepareBorrowTx(newContract, network)
      if (!preparedTx) throw new Error('Unable to prepare Tx')

      // propose contract to alpha factory
      setStage(ModalStages.NeedsFujiApproval)
      const { partialTransaction } = await proposeBorrowContract(preparedTx)

      // sign and broadcast transaction
      setStage(ModalStages.NeedsConfirmation)
      newContract.txid = await signAndBroadcastTx(partialTransaction)

      setStage(ModalStages.NeedsFinishing)

      // add vout to contract
      newContract.vout = 0

      // add additional fields to contract and save to storage
      await saveContractToStorage(newContract, network, preparedTx)

      // show success
      setData(newContract.txid)
      setResult(Outcome.Success)
      reloadContracts()
    } catch (error) {
      setData(extractError(error))
      setResult(Outcome.Failure)
    }
  }

  const retry = (handler: () => {}) => {
    return () => {
      setData('')
      setResult('')
      handler()
    }
  }

  useEffect(() => {
    if (oracles) {
      fetchOffers().then((data) => {
        setOffers(data)
        setLoading(false)
      })
    }
  }, [oracles])

  if (loading) return <Spinner />
  if (!offers) return <SomeError>Error getting offers</SomeError>
  if (!oracles) return <SomeError>Oracles not found</SomeError>
  if (!params || params.length > 4) return <SomeError>Invalid URL</SomeError>

  switch (params.length) {
    case 1:
      // /borrow/fUSD => show list of offers filtered by ticker
      return <Offers offers={offers} ticker={params[0]} />
    case 2:
      // /borrow/fUSD/L-BTC => show form to borrow synthetic
      const offer = offers.find(
        ({ synthetic, collateral }) =>
          synthetic.ticker === params[0] && collateral.ticker === params[1],
      )
      if (!offer) return <SomeError>Offer not found</SomeError>
      return <Borrow offer={offer} oracles={oracles} />
    case 3:
      // /borrow/fUSD/L-BTC/channel => show channel selector
      if (params[2] !== 'channel') return <SomeError>Invalid URL</SomeError>
      if (!newContract) return <SomeError>Contract not found</SomeError>
      return <Channel contract={newContract} task={Tasks.Borrow} />
    case 4:
      // /borrow/fUSD/L-BTC/liquid => show list of liquid enablers
      // /borrow/fUSD/L-BTC/lightning => show list of lightning enablers
      switch (params[3]) {
        case 'liquid':
          if (!newContract) return <SomeError>Contract not found</SomeError>
          return (
            <>
              <EnablersLiquid
                contract={newContract}
                handleMarina={handleMarina}
                task={Tasks.Borrow}
              />
              <MarinaDepositModal
                contract={newContract}
                data={data}
                result={result}
                retry={retry(handleMarina)}
                reset={resetContracts}
                stage={stage}
              />
            </>
          )
        case 'lightning':
          if (!newContract) return <SomeError>Contract not found</SomeError>
          return (
            <>
              <EnablersLightning
                contract={newContract}
                handleInvoice={handleInvoice}
                task={Tasks.Borrow}
              />
              <LightningDepositModal
                contract={newContract}
                data={data}
                invoice={invoice}
                result={result}
                retry={retry(handleInvoice)}
                reset={resetContracts}
                stage={stage}
              />
            </>
          )
        default:
          return <SomeError>Invalid URL</SomeError>
      }
    default:
      return <SomeError>Invalid URL</SomeError>
  }
}

export default BorrowTicker
