import { useContext, useEffect, useState } from 'react'
import { fetchAssets } from 'lib/api'
import { WalletContext } from 'components/providers'
import Spinner from 'components/spinner'
import { prettyNumber, prettyPercentage } from 'lib/pretty'

const BalanceInFiat = () => {
  const [balance, setBalance] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const { wallet } = useContext(WalletContext)

  const delta = -2345.67
  const calcDelta = () => prettyPercentage(delta / balance)
  const deltaClass = delta < 0 ? 'delta red' : 'delta green'

  useEffect(() => {
    setLoading(true)
    fetchAssets().then((data) => {
      setBalance(
        data.reduce((prev, asset) => {
          const quantity = asset.quantity || 0
          prev += quantity * asset.value
          return prev
        }, 0),
      )
      setLoading(false)
    })
  }, [wallet])

  if (!wallet) return <p>🔌 Connect your wallet to view your balance</p>
  if (isLoading) return <Spinner />

  return (
    <>
      <h2 className="is-gradient">US$ {prettyNumber(balance, 2, 2)}</h2>
      <p className={deltaClass}>
        {prettyNumber(delta, 2, 2)} {calcDelta()}
      </p>
    </>
  )
}

export default BalanceInFiat
