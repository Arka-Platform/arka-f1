'use client'

import React from 'react'

export interface HeaderBarProps {
  title: string
  onHeart?: () => void
  onInfo?: () => void
}

export default function HeaderBar({ title, onHeart, onInfo }: HeaderBarProps) {
  return (
    <div
      className={[
        'h-[76px] w-full',
        'rounded-t-[28px]',
        'bg-[linear-gradient(90deg,#b8882f_0%,#d2a445_50%,#b07a2a_100%)]',
        'px-[18px]',
        'flex items-center justify-between gap-4',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]',
      ].join(' ')}
    >
      <div className="min-w-0 flex items-center gap-3">
        <div
          className={[
            'grid h-10 w-10 place-items-center rounded-2xl',
            'bg-white/15',
            'ring-1 ring-white/15',
            'shadow-[0_12px_22px_rgba(0,0,0,0.14)]',
          ].join(' ')}
          aria-hidden
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff3d8" strokeWidth="2.2" aria-hidden>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div
            className="truncate font-black tracking-[-0.01em] text-[#fff3d8] [text-shadow:0_10px_18px_rgba(0,0,0,0.35)]"
            style={{ fontSize: 28, lineHeight: '30px' }}
            title={title}
          >
            {title}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Wishlist"
          onClick={onHeart}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-[0_14px_24px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] transition active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#e25b5b" stroke="#e25b5b" strokeWidth="2" aria-hidden>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Info"
          onClick={onInfo}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-[0_14px_24px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] transition active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c5c45" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </div>
    </div>
  )
}

