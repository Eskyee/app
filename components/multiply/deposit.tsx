import { Contract } from 'lib/types'
import Swap from 'components/deposit/swap'
import Marina from 'components/deposit/marina'
import Channel from 'components/deposit/channel'
import LightningDepositModal from 'components/modals/lightningDeposit'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import { ModalStages } from 'components/modals/modal'

interface MultiplyDepositProps {
  contract: Contract
  channel: string
  setChannel: (arg0: string) => void
  setDeposit: (arg0: boolean) => void
}

const MultiplyDeposit = ({
  contract,
  channel,
  setChannel,
  setDeposit,
}: MultiplyDepositProps) => {
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsCoins)
  const [paid, setPaid] = useState(false)
  const [invoice, setInvoice] = useState('')

  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  const resetDeposit = () => {
    setChannel('')
    setDeposit(false)
  }

  const handleLightning = () => {} // TODO
  const handleMarina = () => {} // TODO

  return (
    <>
      <div className="is-box has-pink-border p-6">
        {!channel && <Channel contract={contract} setChannel={setChannel} />}
        {lightning && <Swap contract={contract} handler={handleLightning} />}
        {liquid && <Marina contract={contract} handler={handleMarina} />}
      </div>
      <MarinaDepositModal
        data={data}
        result={result}
        reset={resetDeposit}
        stage={stage}
      />
      <LightningDepositModal
        data={data}
        invoice={invoice}
        result={result}
        reset={resetDeposit}
        stage={stage}
      />
    </>
  )
}

export default MultiplyDeposit