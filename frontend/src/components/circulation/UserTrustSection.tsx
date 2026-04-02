'use client'

import React from 'react'

export interface UserTrustSectionProps {
  roleLabel: string
  userName: string
  trustScore: number
}

export default function UserTrustSection({ roleLabel, userName, trustScore }: UserTrustSectionProps) {
  const score = Math.max(0, Math.min(100, trustScore))

  return (
    <section className="rounded-[18px] bg-white/55 shadow-[0_18px_44px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.05] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="min-w-0">
          <div className="text-[12px] font-medium tracking-[0.06em] uppercase text-[#3b2a16]/55">{roleLabel}</div>
          <div className="truncate text-[15px] font-medium tracking-[-0.01em] text-[#3b2a16]/90">{userName}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[12px] font-medium tracking-[0.06em] uppercase text-[#3b2a16]/55">Trust</div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-[84px] rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#d2a445_0%,#b07a2a_100%)]"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="tabular-nums text-[13px] font-medium text-[#3b2a16]/80">{score}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

