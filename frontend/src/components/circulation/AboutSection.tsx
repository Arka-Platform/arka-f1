'use client'

import React from 'react'

export interface AboutSectionProps {
  text: string
}

export default function AboutSection({ text }: AboutSectionProps) {
  return (
    <section className="mt-5">
      <div className="flex items-center gap-4 px-1">
        <div className="text-[18px] font-extrabold text-[#7b4a0f]">About</div>
        <div className="h-px flex-1 bg-[#7b4a0f]/15" aria-hidden />
      </div>
      <div className="mt-3 rounded-[18px] bg-white/60 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.05]">
        <p className="m-0 text-[14px] font-semibold leading-[1.55] text-[#3b2a16]">{text}</p>
      </div>
    </section>
  )
}

