'use client'

import React from 'react'

export interface BookMetaProps {
  name: string
  author: string
  genre: string
  condition: string
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
    <div className="flex items-center gap-3 py-[11px]">
      <div className="grid h-6 w-6 place-items-center text-[#b07a2a]">
        {icon}
      </div>
      <div className="text-[14px] font-medium leading-[18px] text-[#3b2a16]/90">{children}</div>
    </div>
  )
}

export default function BookMeta({ name, author, genre, condition, rating }: BookMetaProps) {
  const full = Math.floor(rating)
  const rem = rating - full

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 py-[11px]">
        <div className="grid h-6 w-6 place-items-center text-[#b07a2a]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M8 7h8" />
            <path d="M8 11h6" />
            <path d="M8 15h5" />
          </svg>
        </div>
        <div className="text-[14px] font-medium leading-[18px] text-[#3b2a16]/90">
          <span className="truncate">{name}</span>
        </div>
      </div>

      <div className="divide-y divide-[#3b2a16]/10">
        <Row
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 2a5 5 0 0 1 5 5c0 3-2 5-5 5s-5-2-5-5a5 5 0 0 1 5-5Z" />
              <path d="M20 22a8 8 0 0 0-16 0" />
            </svg>
          }
        >
        <span className="font-medium text-[#5a3812]">{author}</span>
        </Row>

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
        <span className="font-medium text-[#5a3812]">{genre}</span>
        </Row>

        <Row
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
              <path d="M12 3v10" />
              <path d="M8 7l4-4 4 4" />
            </svg>
          }
        >
        <span className="font-medium text-[#5a3812]">{condition}</span>
        </Row>

        <Row
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
            </svg>
          }
        >
        {' '}
          <span className="inline-flex items-center gap-2">
            <span className="font-medium text-[#5a3812]">{rating.toFixed(1)}</span>
            <span className="inline-flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < full
                const partial = i === full && rem > 0
                const opacity = filled ? 1 : partial ? rem : 0.22
                return (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#e2a13a" style={{ opacity }} aria-hidden>
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

