import { prettyNumber } from 'lib/pretty'
import { Contract } from 'lib/types'

interface BorrowInfoProps {
  contract: Contract
}

const BorrowInfo = ({ contract }: BorrowInfoProps) => {
  const { collateral, payout, synthetic } = contract
  const { quantity, ticker, value } = synthetic
  const borrowFee = ((quantity || 0) * value * payout) / 100
  return (
    <div className="is-box has-pink-border">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <div>
              <p>Oracle price</p>
              <p>Borrowing fee</p>
              <p>Collateral price</p>
            </div>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item has-text-right">
            <div className="has-text-right">
              <p>
                1 {ticker} = {prettyNumber(value)} USDt
              </p>
              <p>
                {payout}% = {prettyNumber(borrowFee)} USDt
              </p>
              <p>
                1 {collateral.ticker} = {prettyNumber(collateral.value)} USDt
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BorrowInfo
