'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Book } from '../types/book'
import { usersApi } from '../utils/api'
import {
  getParticipationBalance,
  getParticipationState,
  type ParticipationState,
  type ParticipationUser,
} from '../utils/participation'
import { useAuth } from './AuthContext'

type ContributionContextValue = {
  /** True after first fetch attempt for the current user (or immediately when logged out). */
  countsLoaded: boolean
  offerCount: number
  takeCount: number
  balance: number
  participationState: ParticipationState
  pendingGateBook: Book | null
  gateOpen: boolean
  /** Refetch counts from server (after order, new listing, etc.). */
  refreshParticipation: () => Promise<void>
  openContributionGate: (book: Book) => void
  closeContributionGate: () => void
}

const ContributionContext = createContext<ContributionContextValue | undefined>(undefined)

export function useContribution() {
  const ctx = useContext(ContributionContext)
  if (!ctx) throw new Error('useContribution must be used within ContributionProvider')
  return ctx
}

export function ContributionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [countsLoaded, setCountsLoaded] = useState(false)
  const [offerCount, setOfferCount] = useState(0)
  const [takeCount, setTakeCount] = useState(0)
  const [pendingGateBook, setPendingGateBook] = useState<Book | null>(null)
  const [gateOpen, setGateOpen] = useState(false)

  const refreshParticipation = useCallback(async () => {
    if (!user?.id) {
      setOfferCount(0)
      setTakeCount(0)
      setCountsLoaded(true)
      return
    }
    try {
      const { offerCount: o, takeCount: t } = await usersApi.getParticipationCounts(user.id)
      setOfferCount(o)
      setTakeCount(t)
    } catch {
      setOfferCount(0)
      setTakeCount(0)
    } finally {
      setCountsLoaded(true)
    }
  }, [user?.id])

  useEffect(() => {
    setCountsLoaded(false)
    void refreshParticipation()
  }, [refreshParticipation])

  const participationUser: ParticipationUser = useMemo(
    () => ({ offerCount, takeCount }),
    [offerCount, takeCount]
  )

  const participationState: ParticipationState = useMemo(() => {
    if (!user?.id) return 'ALLOW'
    if (!countsLoaded) return 'ALLOW'
    return getParticipationState(participationUser)
  }, [user?.id, countsLoaded, participationUser])

  const balance = useMemo(() => getParticipationBalance(participationUser), [participationUser])

  const openContributionGate = useCallback((book: Book) => {
    setPendingGateBook(book)
    setGateOpen(true)
  }, [])

  const closeContributionGate = useCallback(() => {
    setGateOpen(false)
    setPendingGateBook(null)
  }, [])

  const value = useMemo<ContributionContextValue>(
    () => ({
      countsLoaded,
      offerCount,
      takeCount,
      balance,
      participationState,
      pendingGateBook,
      gateOpen,
      refreshParticipation,
      openContributionGate,
      closeContributionGate,
    }),
    [
      countsLoaded,
      offerCount,
      takeCount,
      balance,
      participationState,
      pendingGateBook,
      gateOpen,
      refreshParticipation,
      openContributionGate,
      closeContributionGate,
    ]
  )

  return <ContributionContext.Provider value={value}>{children}</ContributionContext.Provider>
}
