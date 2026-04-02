'use client'

import React from 'react'

export interface TagsSectionProps {
  tags: string[]
}

export default function TagsSection({ tags }: TagsSectionProps) {
  if (!tags?.length) return null

  return (
    <section className="rounded-[18px] bg-white/45 ring-1 ring-black/[0.04] px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-[12px] font-medium tracking-[-0.01em] text-[#3b2a16]/80 ring-1 ring-black/[0.05]"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  )
}

