import Image from 'next/image'
import { Contract } from 'lib/types'
import {
  DEPOSIT_LIGHTNING_LIMITS,
  swapDepositAmountOutOfBounds,
} from 'lib/swaps'
import { prettyNumber } from 'lib/pretty'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import { getAssetBalance } from 'lib/marina'

interface ChannelButtonProps {
  name: string
  enabled: boolean
  setChannel: (arg0: string) => void
}
const ChannelButton = ({ name, enabled, setChannel }: ChannelButtonProps) => {
  return (
    <button
      className="button is-primary"
      disabled={!enabled}
      onClick={() => setChannel(name)}
    >
      <Image
        src={`/images/networks/${name}.svg`}
        alt={`${name} network logo`}
        height={20}
        width={20}
      />
      {name}
      <style jsx>{`
        button {
          margin: auto 1rem;
        }
        img {
          margin-right: 1rem;
          max-height: 1.42rem;
        }
      `}</style>
    </button>
  )
}

interface ChannelProps {
  contract: Contract
  setChannel: (arg0: string) => void
}

const Channel = ({ contract, setChannel }: ChannelProps) => {
  const { balances, marina } = useContext(WalletContext)

  if (!marina) throw new Error('Missing marina provider')

  const ticker = contract.collateral.ticker
  const quantity = contract.collateral.quantity || 0
  const balance = getAssetBalance(contract.collateral, balances)

  const { maximal, minimal } = DEPOSIT_LIGHTNING_LIMITS
  const outOfBounds = swapDepositAmountOutOfBounds(quantity)
  const enoughFunds = balance > quantity

  const liquidButtonEnabled = enoughFunds
  const lightningButtonEnabled = ticker === 'L-BTC' && !outOfBounds

  return (
    <div className="has-text-centered">
      <h2 className="has-text-weight-bold is-size-4 mb-4">
        Choose how to deposit {ticker}
      </h2>
      <div className="content mt-6">
        <ChannelButton
          name="liquid"
          enabled={liquidButtonEnabled}
          setChannel={setChannel}
        />
        <ChannelButton
          name="lightning"
          enabled={lightningButtonEnabled}
          setChannel={setChannel}
        />
      </div>
      {!enoughFunds && (
        <p className="warning mx-auto mt-6">Not enough funds on Marina.</p>
      )}
      {outOfBounds && (
        <p className="warning mx-auto mt-6">
          For lightning swaps, collateral amount must be between{' '}
          {prettyNumber(minimal, 0)} and {prettyNumber(maximal, 0)} satoshis.
        </p>
      )}
      <style jsx>{`
        h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        p.warning {
          max-width: 350px;
        }
      `}</style>
    </div>
  )
}

export default Channel
