'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { wishlistApi, bookshelfApi } from '../../utils/api'
import { trackBookView } from '../../utils/tracking'
import type { Book } from '../shared/BookCard/BookCard'

export type CirculateBookCardData = Book & {
  ownerId?: string | null
  /** Display name of the listing owner / counterparty */
  providerName?: string | null
  providerTrustScore?: number | null
  circulationCount?: number | null
  conditionLabel?: string
  tags?: string[]
  /** Who the trust row refers to */
  counterpartyLabel?: 'Offering' | 'Looking for'
}

export interface CirculateBookCardProps {
  book: CirculateBookCardData
  onPick?: (book: Book) => void
  onPass?: (book: Book) => void
  pickLabel?: string
  passLabel?: string
  enableUserCollections?: boolean
}

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function trustTone(score: number): string {
  if (score >= 85) return 'from-emerald-500/15 to-teal-500/10 text-emerald-800 ring-emerald-500/25'
  if (score >= 70) return 'from-amber-400/15 to-orange-400/10 text-amber-900 ring-amber-500/20'
  return 'from-slate-400/15 to-slate-500/10 text-slate-700 ring-slate-400/20'
}

export function CirculateBookCard({
  book,
  onPick,
  onPass,
  pickLabel = 'Pick',
  passLabel = 'Pass',
  enableUserCollections = true,
}: CirculateBookCardProps) {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const reduceMotion = useReducedMotion()
  const viewStartTime = useRef(Date.now())
  const hasTrackedView = useRef(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isTogglingWish, setIsTogglingWish] = useState(false)
  const [isInBookshelf, setIsInBookshelf] = useState(false)
  const [isTogglingShelf, setIsTogglingShelf] = useState(false)

  const cover = book.image || book.thumbnail
  const rating = book.averageRating && book.averageRating > 0 ? book.averageRating : null
  const ratingCount = book.ratingsCount && book.ratingsCount > 0 ? book.ratingsCount : null
  const circ =
    typeof book.circulationCount === 'number' && book.circulationCount >= 0
      ? book.circulationCount
      : null
  const condition = book.conditionLabel ?? 'Listed'
  const trust = typeof book.providerTrustScore === 'number' ? book.providerTrustScore : null
  const displayName = book.providerName?.trim() || 'Community member'
  const tags = book.tags?.filter(Boolean) ?? []
  const counterparty = book.counterpartyLabel ?? 'Offering'

  useEffect(() => {
    if (!enableUserCollections) return
    const run = async () => {
      if (!user?.id || !book.id) return
      try {
        const [w, b] = await Promise.all([
          wishlistApi.checkInWishlist(user.id, book.id),
          bookshelfApi.checkInBookshelf(user.id, book.id),
        ])
        setIsInWishlist(w.isInWishlist)
        setIsInBookshelf(b.isInBookshelf)
      } catch {
        /* optional */
      }
    }
    void run()
  }, [user?.id, book.id, enableUserCollections])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!hasTrackedView.current) {
        trackBookView(book.id, Math.floor((Date.now() - viewStartTime.current) / 1000))
        hasTrackedView.current = true
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [book.id])

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!user?.id) {
      showError('Please log in to use your wishlist')
      return
    }
    if (isTogglingWish) return
    setIsTogglingWish(true)
    try {
      if (isInWishlist) {
        await wishlistApi.removeFromWishlist(user.id, book.id)
        setIsInWishlist(false)
        success('Removed from wishlist')
      } else {
        await wishlistApi.addToWishlist(user.id, book.id)
        setIsInWishlist(true)
        success('Saved to wishlist')
      }
      window.dispatchEvent(new CustomEvent('wishlistUpdated'))
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Wishlist update failed')
    } finally {
      setIsTogglingWish(false)
    }
  }

  const handleBookshelf = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!user?.id) {
      showError('Please log in to use My Bookshelf')
      return
    }
    if (isTogglingShelf) return
    setIsTogglingShelf(true)
    try {
      if (isInBookshelf) {
        await bookshelfApi.removeFromBookshelf(user.id, book.id)
        setIsInBookshelf(false)
        success('Removed from bookshelf')
      } else {
        await bookshelfApi.addToBookshelf(user.id, book.id)
        setIsInBookshelf(true)
        success('On your bookshelf')
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Bookshelf update failed')
    } finally {
      setIsTogglingShelf(false)
    }
  }

  const handlePass = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onPass) {
      onPass(book)
      return
    }
    void handleBookshelf(e)
  }

  const handlePick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPick?.(book)
  }

  const tap = reduceMotion ? {} : { whileTap: { scale: 0.97 } }

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="relative overflow-hidden rounded-[1.35rem] bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_12px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.06]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 opacity-90" />

      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <Link
          href={`/books/${book.id}`}
          className="group/cover relative shrink-0"
          onClick={() => {
            if (!hasTrackedView.current) {
              trackBookView(book.id, Math.floor((Date.now() - viewStartTime.current) / 1000))
              hasTrackedView.current = true
            }
          }}
        >
          <motion.div
            className="relative h-[7.5rem] w-[5.25rem] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner ring-1 ring-black/[0.04] sm:h-[8.25rem] sm:w-[5.75rem]"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover/cover:brightness-[1.03]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100/80 to-violet-100/80 text-[0.65rem] font-semibold uppercase tracking-widest text-indigo-900/40">
                Arka
              </div>
            )}
          </motion.div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/books/${book.id}`}
                className="block font-semibold leading-snug tracking-tight text-slate-900 decoration-slate-300 decoration-1 underline-offset-2 hover:underline"
              >
                {book.title}
              </Link>
              {book.author && (
                <p className="mt-0.5 truncate text-[0.8125rem] text-slate-500">{book.author}</p>
              )}
            </div>
            {trust != null && (
              <span
                className={`shrink-0 rounded-full bg-gradient-to-br px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums ring-1 ${trustTone(trust)}`}
                title="Trust score"
              >
                {Math.round(trust)}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-slate-600">
            {book.genre && (
              <span className="font-medium text-violet-700/90">{book.genre}</span>
            )}
            {book.genre && <span className="text-slate-300">·</span>}
            <span>{condition}</span>
            {rating != null && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-0.5 font-medium text-amber-700">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {rating.toFixed(1)}
                  {ratingCount != null && (
                    <span className="font-normal text-slate-400">({ratingCount})</span>
                  )}
                </span>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-[0.7rem] font-bold text-white shadow-md ring-2 ring-white"
              aria-hidden
            >
              {initials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-medium text-slate-900">{displayName}</p>
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-slate-400">
                {counterparty}
              </p>
            </div>
          </div>

          {((circ != null && circ > 0) || tags.length > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {circ != null && circ > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-slate-600 ring-1 ring-slate-200/80">
                  {circ} circulations
                </span>
              )}
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-violet-900 ring-1 ring-violet-500/15"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 pb-3 sm:gap-2.5 sm:px-4 sm:pb-4">
        <motion.button
          type="button"
          {...tap}
          onClick={handlePass}
          className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-[0.9375rem] font-bold transition-colors ${
            isInBookshelf && !onPass
              ? 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/50'
              : 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/90 hover:bg-slate-200/90'
          }`}
        >
          {!onPass && isInBookshelf ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : onPass ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          )}
          {passLabel}
        </motion.button>
        <motion.button
          type="button"
          {...tap}
          onClick={handlePick}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-[0.9375rem] font-bold text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,0.55)] ring-1 ring-white/20 hover:brightness-[1.03] active:brightness-[0.98]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M12 20l9-5-9-5-9 5 9 5z" />
            <path d="M12 12l9-5-9-5-9 5 9 5z" opacity="0.35" />
          </svg>
          {pickLabel}
        </motion.button>
      </div>

      {user && enableUserCollections && (
        <div className="flex border-t border-slate-100/90 bg-slate-50/80">
          <motion.button
            type="button"
            {...tap}
            onClick={handleWishlist}
            disabled={isTogglingWish}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-[0.8125rem] font-semibold transition-colors ${
              isInWishlist ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg
              className="h-[1.125rem] w-[1.125rem]"
              viewBox="0 0 24 24"
              fill={isInWishlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
            </svg>
            Wishlist
          </motion.button>
          <div className="w-px bg-slate-200/90" />
          <motion.button
            type="button"
            {...tap}
            onClick={handleBookshelf}
            disabled={isTogglingShelf}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-[0.8125rem] font-semibold transition-colors ${
              isInBookshelf ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="h-[1.125rem] w-[1.125rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            My Bookshelf
          </motion.button>
        </div>
      )}
    </motion.article>
  )
}

export default CirculateBookCard
