'use client'

import { useContribution } from '../../contexts/ContributionContext'
import ContributeToUnlockModal from './ContributeToUnlockModal'

export default function ContributionGateHost() {
  const { gateOpen, pendingGateBook, closeContributionGate } = useContribution()

  return (
    <ContributeToUnlockModal open={gateOpen} book={pendingGateBook} onClose={closeContributionGate} />
  )
}
