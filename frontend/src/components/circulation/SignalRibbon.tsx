'use client'

import React from 'react'

interface Props {
  text: string
}

export default function SignalRibbon({ text }: Props) {
  return (
    <div className="absolute top-5 -right-11 rotate-[30deg] pointer-events-none">
      <div className="
        px-9 py-1.5
        text-[11px]
        font-medium
        text-[#3f2f1b]/80
        bg-[#f4e7c2]
        border border-[#e7d3a3]/60
        shadow-[0_4px_10px_rgba(0,0,0,0.06)]
      ">
        {text}
      </div>
    </div>
  )
}
