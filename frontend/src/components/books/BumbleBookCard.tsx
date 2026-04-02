'use client'

import React from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

export type BumbleBadge = { icon: 'near' | 'requests' | 'trending'; text: string }

export type BumbleProvider = {
  name: string
  trustScore: number | null
}

export type BumbleBook = {
  id: string
  title: string
  author: string
  coverUrl: string | null
  genre: string | null
  condition: string | null
  rating: number | null
  circulationCount: number | null
  provider: BumbleProvider
  badge: BumbleBadge | null
  wishlisted: boolean
}

export interface BumbleBookCardProps {
  book: BumbleBook
  variant?: 'center' | 'peek'
  onToggleWishlist?: () => void
  onPick?: () => void
  onPass?: () => void
}

function BadgeIcon({ icon }: { icon: BumbleBadge['icon'] }) {
  if (icon === 'near') {
    return (
      <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  }
  if (icon === 'requests') {
    return (
      <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2c-3.9 3.2-7 6.4-7 10.4C5 16.6 8.1 20 12 20s7-3.4 7-7.6C19 8.4 15.9 5.2 12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  }
  return (
    <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2l2.2 6.9H22l-5.7 4.2 2.2 6.9L12 15.8 5.5 20l2.2-6.9L2 8.9h7.8L12 2z" />
    </svg>
  )
}

export default function BumbleBookCard({
  book,
  variant = 'center',
  onToggleWishlist,
  onPick,
  onPass,
}: BumbleBookCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-160, 0, 160], [-6, 0, 6])
  const scale = useTransform(x, [-160, 0, 160], [0.99, 1, 0.99])
  const likeOpacity = useTransform(x, [30, 120], [0, 1])
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0])

  const canDrag = variant === 'center'

  return (
    <motion.article
      className={[
        'relative w-full overflow-hidden rounded-[28px]',
        'bg-[#fbfaf7]',
        'ring-1 ring-black/[0.035]',
        'shadow-[0_28px_70px_rgba(35,25,12,0.14)]',
        variant === 'peek' ? 'pointer-events-none' : '',
      ].join(' ')}
      initial={variant === 'center' ? { opacity: 0, y: 16, scale: 0.985 } : undefined}
      animate={variant === 'center' ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={variant === 'center' ? { type: 'spring', stiffness: 420, damping: 34 } : undefined}
      style={canDrag ? { x, rotate, scale } : undefined}
      drag={canDrag ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        if (!canDrag) return
        const dx = info.offset.x
        if (dx > 95) onPick?.()
        else if (dx < -95) onPass?.()
      }}
      aria-label={`Book: ${book.title}`}
    >
      {/* Top media */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/10 via-black/0 to-transparent" />

        {book.badge ? (
          <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-[#2b2216] shadow-[0_12px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05] backdrop-blur">
            <span className="text-[#f0c46a]">
              <BadgeIcon icon={book.badge.icon} />
            </span>
            <span>{book.badge.text}</span>
          </div>
        ) : null}

        {variant === 'center' ? (
          <button
            type="button"
            aria-label={book.wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={book.wishlisted}
            onClick={onToggleWishlist}
            className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/85 shadow-[0_12px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05] backdrop-blur transition active:scale-[0.98]"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill={book.wishlisted ? '#e25b5b' : 'none'}
              stroke={book.wishlisted ? '#e25b5b' : '#2b2216'}
              strokeWidth="2"
              aria-hidden
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
            </svg>
          </button>
        ) : null}

        {/* LIKE/NOPE overlays */}
        {variant === 'center' ? (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute left-5 top-20 z-20 rotate-[-12deg] rounded-2xl bg-emerald-500/90 px-4 py-2 text-[14px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(16,185,129,0.25)]"
              aria-hidden
            >
              PICK
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute right-5 top-20 z-20 rotate-[12deg] rounded-2xl bg-rose-500/90 px-4 py-2 text-[14px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(244,63,94,0.22)]"
              aria-hidden
            >
              PASS
            </motion.div>
          </>
        ) : null}

        <div className="relative overflow-hidden rounded-[28px] bg-[#efe8dd]">
          <div className="aspect-[4/3] w-full">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-contain px-9 py-9"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="grid h-full w-full place-items-center px-10 text-center text-[#6a5a44]">
                <div>
                  <div className="text-lg font-semibold">{book.title}</div>
                  <div className="mt-1 text-sm opacity-70">{book.author}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 pb-6 pt-5">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[#2b2216]">{book.title}</h2>
        <p className="mt-1 text-[14px] font-medium text-[#6c5c45]">{book.author}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {book.genre ? (
            <span className="rounded-full bg-[#ece7de] px-3 py-1 text-[12px] font-semibold text-[#4b3d2a]">
              {book.genre}
            </span>
          ) : null}
          {book.condition ? (
            <span className="rounded-full bg-[#e6efe4] px-3 py-1 text-[12px] font-semibold text-[#2f4b34]">
              {book.condition}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-6 text-[13px] font-semibold text-[#6c5c45]">
          <div className="inline-flex items-center gap-2">
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="#f0c46a" aria-hidden>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[#2b2216]">{book.rating != null ? book.rating.toFixed(1) : '—'}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="#6c5c45" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>{book.circulationCount != null ? `${book.circulationCount} circulations` : '0 circulations'}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-full bg-white/70 px-3 py-2 shadow-[0_16px_34px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] backdrop-blur">
          <div className="h-7 w-7 overflow-hidden rounded-full bg-[#ded3bf]">
            <div className="grid h-full w-full place-items-center text-[11px] font-bold text-[#2b2216]">
              {book.provider.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#2b2216]">Offered by {book.provider.name}</div>
          </div>
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#2b2216]">
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="#6c5c45" strokeWidth="2" aria-hidden>
              <path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
              <path d="M9.5 10.5l1.8 1.8 3.6-3.6" />
            </svg>
            <span>{book.provider.trustScore != null ? Math.round(book.provider.trustScore) : '—'}</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="#6c5c45" strokeWidth="2" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

