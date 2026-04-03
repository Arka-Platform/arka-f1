'use client'

import React from 'react'

export interface UserTrustSectionProps {
  userName: string
  trustScore: number
}

export default function UserTrustSection({ userName, trustScore }: UserTrustSectionProps) {
  const score = Math.max(0, Math.min(100, trustScore))

  return (
    <div className="flex items-center justify-between gap-3">

      {/* LEFT: NAME */}
      <div className="min-w-0">
        <div className="truncate text-[14px] font-medium tracking-[-0.01em] text-[#3b2a16]/85">
          {userName}
        </div>
      </div>

      {/* RIGHT: TRUST */}
      <div className="flex items-center gap-2">

        {/* BAR */}
        <div className="h-[6px] w-[72px] rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#d2a445_0%,#b07a2a_100%)] transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>

        {/* SCORE */}
        <div className="tabular-nums text-[12px] font-medium text-[#3b2a16]/70">
          {score}
        </div>

      </div>
    </div>
  )
}
