'use client'

import React from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

export type CirculationBadge = { type: 'requests' | 'near' | 'trending'; text: string }

export interface CirculationBookCardModel {
  id: string
  coverUrl: string | null
  title: string
  author: string
  genre: string
  condition: string
  rating: number
  circulationCount: number
  providerName: string
  providerTrustScore: number
  badge: CirculationBadge
  wishlisted?: boolean
}

export interface BookCardProps {
  model: CirculationBookCardModel
  onToggleWishlist?: () => void
  onPick?: () => void
  onPass?: () => void
}

function BadgeIcon({ type }: { type: CirculationBadge['type'] }) {
  if (type === 'requests') {
    return (
      <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2c-3.9 3.2-7 6.4-7 10.4C5 16.6 8.1 20 12 20s7-3.4 7-7.6C19 8.4 15.9 5.2 12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  }
  if (type === 'near') {
    return (
      <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  }
  return (
    <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2l2.2 6.9H22l-5.7 4.2 2.2 6.9L12 15.8 5.5 20l2.2-6.9L2 8.9h7.8L12 2z" />
    </svg>
  )
}

export default function BookCard({ model, onToggleWishlist, onPick, onPass }: BookCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-140, 0, 140], [-5.5, 0, 5.5])
  const scale = useTransform(x, [-140, 0, 140], [0.99, 1, 0.99])

  return (
    <motion.article
      className={[
        'relative w-full overflow-hidden rounded-[26px] bg-[#fbfaf7]',
        'shadow-[0_20px_55px_rgba(35,25,12,0.12)]',
        'ring-1 ring-black/[0.04]',
      ].join(' ')}
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      style={{ x, rotate, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        const dx = info.offset.x
        if (dx > 95) onPick?.()
        else if (dx < -95) onPass?.()
      }}
    >
      <div className="relative">
        {/* Badge + wishlist */}
        <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-[#2b2216] shadow-[0_10px_22px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05] backdrop-blur">
          <span className="text-[#c68a2e]">
            <BadgeIcon type={model.badge.type} />
          </span>
          <span>{model.badge.text}</span>
        </div>

        <button
          type="button"
          aria-label={model.wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={Boolean(model.wishlisted)}
          onClick={onToggleWishlist}
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/85 shadow-[0_10px_22px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05] backdrop-blur transition active:scale-[0.98]"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill={model.wishlisted ? '#e25b5b' : 'none'}
            stroke={model.wishlisted ? '#e25b5b' : '#2b2216'}
            strokeWidth="2"
            aria-hidden
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
          </svg>
        </button>

        {/* Cover */}
        <div className="relative overflow-hidden rounded-[26px] bg-[#efe8dd]">
          <div className="aspect-[4/3] w-full">
            {model.coverUrl ? (
              <img
                src={model.coverUrl}
                alt={model.title}
                className="h-full w-full object-contain px-8 py-8"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full w-full place-items-center px-8 text-center text-[#6a5a44]">
                <div>
                  <div className="text-lg font-semibold">{model.title}</div>
                  <div className="mt-1 text-sm opacity-70">{model.author}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-5">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[#2b2216]">{model.title}</h2>
        <p className="mt-1 text-[14px] font-medium text-[#6c5c45]">{model.author}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#ece7de] px-3 py-1 text-[12px] font-semibold text-[#4b3d2a]">
            {model.genre}
          </span>
          <span className="rounded-full bg-[#e6efe4] px-3 py-1 text-[12px] font-semibold text-[#2f4b34]">
            {model.condition}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-6 text-[13px] font-semibold text-[#6c5c45]">
          <div className="inline-flex items-center gap-2">
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="#c68a2e" aria-hidden>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[#2b2216]">{model.rating.toFixed(1)}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="#6c5c45" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>{model.circulationCount} circulations</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-full bg-white/70 px-3 py-2 shadow-[0_16px_34px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] backdrop-blur">
          <div className="h-7 w-7 overflow-hidden rounded-full bg-[#d7cbb7]">
            <div className="grid h-full w-full place-items-center text-[11px] font-bold text-[#2b2216]">
              {model.providerName.slice(0, 1).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#2b2216]">Offered by {model.providerName}</div>
          </div>
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#2b2216]">
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="#6c5c45" strokeWidth="2" aria-hidden>
              <path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
              <path d="M9.5 10.5l1.8 1.8 3.6-3.6" />
            </svg>
            <span>{Math.round(model.providerTrustScore)}</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="#6c5c45" strokeWidth="2" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

