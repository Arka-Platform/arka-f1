'use client'

import React from 'react'

export interface BumbleActionBarProps {
  onPass?: () => void
  onPick?: () => void
  onWishlist?: () => void
}

function CircleButton({
  label,
  icon,
  variant,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  variant: 'secondary' | 'primary'
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        'grid h-14 w-14 place-items-center rounded-full',
        'ring-1 ring-black/[0.04] backdrop-blur',
        variant === 'primary'
          ? 'bg-[#f0c46a] shadow-[0_20px_44px_rgba(50,35,16,0.18)]'
          : 'bg-white/75 shadow-[0_18px_38px_rgba(0,0,0,0.10)]',
        'transition active:scale-[0.98]',
      ].join(' ')}
    >
      {icon}
    </button>
  )
}

export default function BumbleActionBar({ onPass, onPick, onWishlist }: BumbleActionBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-[max(18px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto w-full max-w-[420px] px-6">
        <div className="flex items-center justify-center gap-6 rounded-[28px] bg-white/70 px-6 py-4 shadow-[0_28px_70px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.04] backdrop-blur">
          <CircleButton
            label="Pass"
            variant="secondary"
            onClick={onPass}
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                <path d="M12 20V6" />
                <path d="M7 11l5-5 5 5" />
              </svg>
            }
          />
          <CircleButton
            label="Pick"
            variant="primary"
            onClick={onPick}
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                <path d="M12 4v14" />
                <path d="M7 13l5 5 5-5" />
              </svg>
            }
          />
          <CircleButton
            label="Wishlist"
            variant="secondary"
            onClick={onWishlist}
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  )
}

