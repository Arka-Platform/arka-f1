'use client'

import React from 'react'

export interface BookMetaProps {
  genre: string
  published: string
  pages: string
  rating: number
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-[#f1e2c8] text-[#8b5a1f] ring-1 ring-[#e2c28b]/40 shadow-[0_10px_18px_rgba(0,0,0,0.06)]">
        {icon}
      </div>
      <div className="text-[14px] font-semibold text-[#3b2a16]">{children}</div>
    </div>
  )
}

export default function BookMeta({ genre, published, pages, rating }: BookMetaProps) {
  const full = Math.floor(rating)
  const rem = rating - full

  return (
    <div className="flex flex-col">
      <div className="inline-flex max-w-full items-center gap-3 rounded-full bg-[#f1e2c8] px-4 py-2 text-[14px] font-extrabold text-[#7b4a0f] ring-1 ring-[#e2c28b]/35 shadow-[0_12px_22px_rgba(0,0,0,0.06)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M8 7h8" />
          <path d="M8 11h6" />
          <path d="M8 15h5" />
        </svg>
        <span className="truncate">{genre}</span>
      </div>

      <div className="mt-4 divide-y divide-[#3b2a16]/10">
        <Row
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16" />
              <path d="M4 17h16" />
              <path d="M7 4v16" />
              <path d="M17 4v16" />
            </svg>
          }
        >
          Published: <span className="font-extrabold text-[#5a3812]">{published}</span>
        </Row>

        <Row
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        >
          Pages: <span className="font-extrabold text-[#5a3812]">{pages}</span>
        </Row>

        <Row
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
            </svg>
          }
        >
          Rating:{' '}
          <span className="inline-flex items-center gap-2">
            <span className="font-extrabold text-[#5a3812]">{rating.toFixed(1)}</span>
            <span className="inline-flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < full
                const partial = i === full && rem > 0
                const opacity = filled ? 1 : partial ? rem : 0.22
                return (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#e2a13a" style={{ opacity }} aria-hidden>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
                  </svg>
                )
              })}
            </span>
          </span>
        </Row>
      </div>
    </div>
  )
}

