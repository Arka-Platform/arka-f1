'use client'

import React from 'react'

type Variant = 'default' | 'highlight'

interface SignalRibbonProps {
  text: string
  variant?: Variant
}

export default function SignalRibbon({
  text,
  variant = 'default',
}: SignalRibbonProps) {

  const styles = {
    default: 'bg-[#e7e5e4] text-[#1c1917]/80 border-black/[0.05]',
    highlight: 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]/60',
  }

  return (
    <div className="absolute top-5 -right-12 rotate-[32deg] pointer-events-none select-none">
      <div
        className={`
          relative
          px-10 py-1.5
          text-[11px]
          font-medium
          tracking-[-0.01em]
          border
          shadow-[0_6px_16px_rgba(0,0,0,0.08)]
          ${styles[variant]}
        `}
      >
        {text}

        {/* subtle fold illusion */}
        <span className="
          absolute inset-0
          -z-10
          translate-y-[2px]
          bg-black/[0.04]
        " />
      </div>
    </div>
  )
}