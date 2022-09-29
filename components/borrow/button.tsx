import { WalletContext } from 'components/providers/wallet'
import { fetchAsset } from 'lib/api'
import { feeAmount, minDustLimit } from 'lib/constants'
import { getAssetBalance } from 'lib/marina'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import { Contract } from 'lib/types'
import { useContext, useEffect, useState } from 'react'

interface BorrowButtonProps {
  contract: Contract
  minRatio: number
  ratio: number
  setDeposit: (arg0: boolean) => void
}

const BorrowButton = ({
  contract,
  minRatio,
  ratio,
  setDeposit,
}: BorrowButtonProps) => {
  const { balances, connected } = useContext(WalletContext)
  const [enoughFunds, setEnoughFunds] = useState(false)
  const { collateral, oracles, payoutAmount, synthetic } = contract

  useEffect(() => {
    fetchAsset(contract.collateral.ticker).then((asset) => {
      const funds = getAssetBalance(asset, balances)
      const needed = contract.collateral.quantity || 0
      const enoughFundsOnMarina = connected && funds > needed
      const outOfBounds = swapDepositAmountOutOfBounds(needed)
      setEnoughFunds(enoughFundsOnMarina || !outOfBounds)
    })
  })

  const enabled =
    connected &&
    enoughFunds &&
    collateral.quantity &&
    collateral.quantity > 0 &&
    collateral.value > 0 &&
    ratio >= minRatio &&
    synthetic.quantity &&
    synthetic.quantity > 0 &&
    synthetic.value > 0 &&
    oracles &&
    oracles.length > 0 &&
    payoutAmount &&
    payoutAmount >= minDustLimit &&
    collateral.quantity > payoutAmount + feeAmount + minDustLimit

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={() => setDeposit(true)}
      >
        Proceed to deposit
      </button>
    </div>
  )
}

export default BorrowButton
