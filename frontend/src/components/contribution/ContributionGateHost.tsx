'use client'

import { useContribution } from '../../contexts/ContributionContext'
import ContributeToUnlockModal from './ContributeToUnlockModal'

export default function ContributionGateHost() {
  const { gateOpen, pendingGateBook, closeContributionGate, presenceLabel } = useContribution()

  return (
    <ContributeToUnlockModal
      open={gateOpen}
      book={pendingGateBook}
      presenceLabel={presenceLabel}
      onClose={closeContributionGate}
    />
  )
}
