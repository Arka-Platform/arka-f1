'use client'

import { useCallback, useEffect, useState, type MouseEvent } from 'react'

/** Pass to `BookTile` — wraps icon clicks so they never trigger expand. */
export type BookIconAction = (fn?: () => void) => (e: MouseEvent<HTMLElement>) => void

export interface UseBookInteractionsOptions {
  /** Controlled expanded state */
  expanded?: boolean
  onExpandedChange?: (open: boolean) => void
  /** Uncontrolled initial value */
  defaultExpanded?: boolean
}

/**
 * Separates expand (surface) vs quick actions (icons): icon handlers stop propagation.
 * Use `iconAction` for wishlist / library / swap buttons on the tile.
 */
export function useBookInteractions(options: UseBookInteractionsOptions = {}) {
  const { expanded: controlled, onExpandedChange, defaultExpanded = false } = options
  const [uncontrolled, setUncontrolled] = useState(defaultExpanded)
  const isControlled = controlled !== undefined
  const expanded = isControlled ? controlled : uncontrolled

  const setExpanded = useCallback(
    (open: boolean) => {
      if (!isControlled) setUncontrolled(open)
      onExpandedChange?.(open)
    },
    [isControlled, onExpandedChange]
  )

  const openExpanded = useCallback(() => setExpanded(true), [setExpanded])
  const closeExpanded = useCallback(() => setExpanded(false), [setExpanded])
  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded, setExpanded])

  /** Wrap icon `onClick` so the tile does not expand and navigation does not occur. */
  const iconAction = useCallback(
    (action?: () => void) => (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      e.preventDefault()
      action?.()
    },
    []
  )

  return {
    expanded,
    setExpanded,
    openExpanded,
    closeExpanded,
    toggleExpanded,
    iconAction,
  }
}

/** Attach to expanded overlay root: Escape closes, locks scroll while open. */
export function useBookExpandedOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
}
