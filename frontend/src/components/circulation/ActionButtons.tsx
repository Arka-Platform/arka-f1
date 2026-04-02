'use client'

import React from 'react'

export interface ActionButtonsProps {
  onPreview?: () => void
  onAddToLibrary?: () => void
}

export default function ActionButtons({ onPreview, onAddToLibrary }: ActionButtonsProps) {
  return (
    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={onPreview}
        className={[
          'flex-1 h-[54px] rounded-full',
          'bg-[linear-gradient(180deg,#e7b05c_0%,#d99232_52%,#c56b18_100%)]',
          'text-[#2b2216]',
          'font-extrabold text-[15px]',
          'shadow-[0_18px_34px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.06)]',
          'ring-1 ring-black/[0.06]',
          'transition active:scale-[0.99]',
        ].join(' ')}
      >
        <span className="inline-flex items-center justify-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/25 ring-1 ring-white/25">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          Preview More
        </span>
      </button>

      <button
        type="button"
        onClick={onAddToLibrary}
        className={[
          'flex-1 h-[54px] rounded-full',
          'bg-white/75',
          'text-[#2b2216]',
          'font-extrabold text-[15px]',
          'shadow-[0_18px_34px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.82),inset_0_-1px_0_rgba(0,0,0,0.05)]',
          'ring-1 ring-black/[0.10]',
          'transition active:scale-[0.99]',
        ].join(' ')}
      >
        <span className="inline-flex items-center justify-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-black/[0.04] ring-1 ring-black/[0.06]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </span>
          Add to Library
        </span>
      </button>
    </div>
  )
}

