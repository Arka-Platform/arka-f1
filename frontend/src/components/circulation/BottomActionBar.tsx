'use client'

import React from 'react'

export interface BottomActionBarProps {
  active?: 'pick' | 'pass' | 'wishlist' | 'bookshelf'
  onPick?: () => void
  onPass?: () => void
  onWishlist?: () => void
  onBookshelf?: () => void
}

function Action({
  label,
  sublabel,
  icon,
  active,
  onClick,
}: {
  label: string
  sublabel: string
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-2 py-3 transition active:scale-[0.99]"
    >
      <div
        className={[
          'grid h-14 w-14 place-items-center rounded-2xl',
          active ? 'bg-[#f0c46a] shadow-[0_18px_36px_rgba(50,35,16,0.16)]' : 'bg-white/75 shadow-[0_14px_28px_rgba(0,0,0,0.08)]',
          'ring-1 ring-black/[0.04] backdrop-blur',
        ].join(' ')}
      >
        {icon}
      </div>
      <div className="text-center leading-tight">
        <div className="text-[14px] font-semibold text-[#2b2216]">{label}</div>
        <div className="mt-0.5 text-[12px] font-medium text-[#6c5c45]">{sublabel}</div>
      </div>
    </button>
  )
}

export default function BottomActionBar({ active = 'pick', onPick, onPass, onWishlist, onBookshelf }: BottomActionBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-[max(18px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto w-full max-w-[420px] px-4">
        <div className="rounded-[26px] bg-white/70 shadow-[0_26px_70px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.04] backdrop-blur">
          <div className="grid grid-cols-4">
            <Action
              label="Pick"
              sublabel="Take a book"
              active={active === 'pick'}
              onClick={onPick}
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                  <path d="M12 5v14" />
                  <path d="M19 12H5" />
                </svg>
              }
            />
            <Action
              label="Pass"
              sublabel="Give a book"
              active={active === 'pass'}
              onClick={onPass}
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                  <path d="M12 19V5" />
                </svg>
              }
            />
            <Action
              label="Wishlist"
              sublabel="Books you want"
              active={active === 'wishlist'}
              onClick={onWishlist}
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
                </svg>
              }
            />
            <Action
              label="My Bookshelf"
              sublabel="Your books"
              active={active === 'bookshelf'}
              onClick={onBookshelf}
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

