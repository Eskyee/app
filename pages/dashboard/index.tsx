import type { NextPage } from 'next'
import Activities from 'components/activities'
import Assets from 'components/assets'
import Contracts from 'components/contracts'
import { useContext, useEffect } from 'react'
import { ContractsContext } from 'components/providers/contracts'

const Dashboard: NextPage = () => {
  const { resetContracts } = useContext(ContractsContext)

  useEffect(() => {
    resetContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Assets />
      <div className="vertical-space"></div>
      <Contracts />
      <div className="vertical-space"></div>
      <Activities />
      <style jsx>{`
        div.vertical-space {
          min-height: 3rem;
        }
      `}</style>
    </>
  )
}

export default Dashboard
