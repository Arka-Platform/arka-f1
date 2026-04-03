'use client'

import React from 'react'

interface Props {
  author: string
  genre: string
  condition: string
  rating: number
}

export default function BookMeta({
  author,
  genre,
  condition,
  rating,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">

      <div className="text-[14px] text-[#1c1917]/70">
        {author} · {genre}
      </div>

      <div className="text-[13px] text-[#1c1917]/55">
        {condition}
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[13px] font-medium text-[#1c1917]/80">
          {rating.toFixed(1)}
        </span>

        <div className="flex gap-[2px]">
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i < Math.floor(rating)
            return (
              <svg
                key={i}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={filled ? '#1c1917' : 'rgba(0,0,0,0.15)'}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
              </svg>
            )
          })}
        </div>
      </div>

    </div>
  )
}
