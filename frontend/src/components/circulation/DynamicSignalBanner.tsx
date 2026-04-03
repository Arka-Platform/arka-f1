'use client'

import React, { useMemo } from 'react'

type SignalType = 'demand' | 'proximity' | 'speed'

interface Signal {
  type: SignalType
  value: number | string
}

interface Props {
  signals: Signal[]
}

export default function DynamicSignalBanner({ signals }: Props) {

  const priorityMap: Record<SignalType, number> = {
    demand: 3,
    proximity: 2,
    speed: 1,
  }

  const primary = useMemo(() => {
    if (!signals.length) return null
    return [...signals].sort(
      (a, b) => priorityMap[b.type] - priorityMap[a.type]
    )[0]
  }, [signals])

  if (!primary) return null

  // ✨ REFINED CONTENT (no emojis, editorial tone)
  const getText = () => {
    switch (primary.type) {
      case 'demand':
        return `${primary.value} requests`
      case 'proximity':
        return `${primary.value} nearby`
      case 'speed':
        return `ready in ${primary.value}`
      default:
        return ''
    }
  }

  const text = getText()

  // ✨ MINIMAL STYLE SYSTEM (no loud colors)
  const base =
    'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[-0.01em] transition-all duration-200'

  const variants = {
    demand: 'bg-black/[0.06] text-[#1c1917]/80',
    proximity: 'bg-black/[0.04] text-[#1c1917]/70',
    speed: 'bg-black/[0.03] text-[#1c1917]/60',
  }

  return (
    <div
      className={`${base} ${variants[primary.type]}`}
    >
      {text}
    </div>
  )
}
