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
import type { Book } from '../components/shared/BookCard/BookCard'

const STORAGE_KEY = 'arka_contribution_v1'

export type ContributionKind = 'listed_book' | 'fulfilled_get' | 'community_offer'

type ContributionState = {
  /** After one free catalog pickup (first distinct book), further picks need presence. */
  freeIntroClaimConsumed: boolean
  /** Signals of giving back — not “points”, used only for access + soft copy. */
  presenceCount: number
}

type ContributionContextValue = {
  hydrated: boolean
  freeIntroClaimConsumed: boolean
  presenceCount: number
  /** Short label for UI: newcomer / contributor / steady presence */
  presenceLabel: string
  pendingGateBook: Book | null
  gateOpen: boolean
  mayClaimAdditionalBook: () => boolean
  /** Call after a successful add of a new line item (CartContext). */
  afterSuccessfulNewLineAdd: () => void
  /** Real contribution events (listing, fulfilling a get, etc.) */
  registerPresence: (kind: ContributionKind) => void
  openContributionGate: (book: Book) => void
  closeContributionGate: () => void
}

const defaultState: ContributionState = {
  freeIntroClaimConsumed: false,
  presenceCount: 0,
}

function parseStored(raw: string | null): ContributionState {
  if (!raw) return { ...defaultState }
  try {
    const p = JSON.parse(raw) as Partial<ContributionState>
    return {
      freeIntroClaimConsumed: !!p.freeIntroClaimConsumed,
      presenceCount: typeof p.presenceCount === 'number' && p.presenceCount >= 0 ? p.presenceCount : 0,
    }
  } catch {
    return { ...defaultState }
  }
}

function presenceLabelFor(count: number): string {
  if (count <= 0) return 'New to the circle'
  if (count === 1) return 'Contributor'
  if (count <= 3) return 'Active presence'
  return 'Steady presence'
}

const ContributionContext = createContext<ContributionContextValue | undefined>(undefined)

export function useContribution() {
  const ctx = useContext(ContributionContext)
  if (!ctx) throw new Error('useContribution must be used within ContributionProvider')
  return ctx
}

export function ContributionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContributionState>(defaultState)
  const [hydrated, setHydrated] = useState(false)
  const [pendingGateBook, setPendingGateBook] = useState<Book | null>(null)
  const [gateOpen, setGateOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setState(parseStored(localStorage.getItem(STORAGE_KEY)))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const mayClaimAdditionalBook = useCallback(() => {
    if (!hydrated) return true
    return !state.freeIntroClaimConsumed || state.presenceCount > 0
  }, [hydrated, state.freeIntroClaimConsumed, state.presenceCount])

  const afterSuccessfulNewLineAdd = useCallback(() => {
    setState((prev) => {
      if (prev.freeIntroClaimConsumed) return prev
      return { ...prev, freeIntroClaimConsumed: true }
    })
  }, [])

  const registerPresence = useCallback((_kind: ContributionKind) => {
    setState((prev) => ({
      ...prev,
      presenceCount: prev.presenceCount + 1,
    }))
  }, [])

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
      hydrated,
      freeIntroClaimConsumed: state.freeIntroClaimConsumed,
      presenceCount: state.presenceCount,
      presenceLabel: presenceLabelFor(state.presenceCount),
      pendingGateBook,
      gateOpen,
      mayClaimAdditionalBook,
      afterSuccessfulNewLineAdd,
      registerPresence,
      openContributionGate,
      closeContributionGate,
    }),
    [
      hydrated,
      state.freeIntroClaimConsumed,
      state.presenceCount,
      pendingGateBook,
      gateOpen,
      mayClaimAdditionalBook,
      afterSuccessfulNewLineAdd,
      registerPresence,
      openContributionGate,
      closeContributionGate,
    ]
  )

  return <ContributionContext.Provider value={value}>{children}</ContributionContext.Provider>
}
