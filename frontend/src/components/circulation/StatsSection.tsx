'use client'

import React from 'react'

export interface StatsSectionProps {
  copiesSold: string
  readTime: string
  keyConcepts: string
}

function StatRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f1e2c8] text-[#8b5a1f] ring-1 ring-[#e2c28b]/35 shadow-[0_10px_18px_rgba(0,0,0,0.06)]">
        {icon}
      </div>
      <div className="text-[14px] font-semibold leading-tight text-[#3b2a16]">{children}</div>
    </div>
  )
}

export default function StatsSection({ copiesSold, readTime, keyConcepts }: StatsSectionProps) {
  return (
    <section>
      <div className="rounded-[18px] bg-white/55 shadow-[0_18px_44px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.05] overflow-hidden">
        <div className="divide-y divide-[#3b2a16]/10">
          <StatRow
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 20V10" />
                <path d="M10 20V4" />
                <path d="M16 20V14" />
                <path d="M22 20V8" />
              </svg>
            }
          >
            <span className="font-extrabold">Over </span>
            <span className="font-extrabold">{copiesSold}</span>
            <span className="font-extrabold"> Copies Sold</span>
          </StatRow>

          <StatRow
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          >
            <span className="font-extrabold">Average Read Time:</span> <span className="font-extrabold">{readTime}</span>
          </StatRow>

          <StatRow
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            }
          >
            <span className="font-extrabold">Key Concepts:</span> <span className="font-extrabold">{keyConcepts}</span>
          </StatRow>
        </div>
      </div>
    </section>
  )
}

