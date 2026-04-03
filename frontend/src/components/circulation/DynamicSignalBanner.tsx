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

  // PRIORITY MAP
  const priorityMap: Record<SignalType, number> = {
    demand: 3,
    proximity: 2,
    speed: 1,
  }

  // GET PRIMARY SIGNAL (without mutating original array)
  const primary = useMemo(() => {
    if (!signals.length) return null

    return [...signals].sort(
      (a, b) => priorityMap[b.type] - priorityMap[a.type]
    )[0]
  }, [signals])

  if (!primary) return null

  // CONTENT MAPPING
  const getContent = () => {
    switch (primary.type) {
      case 'demand':
        return {
          text: `🔥 ${primary.value} people waiting`,
          style: 'high' as const,
        }
      case 'proximity':
        return {
          text: `📍 ${primary.value} copies nearby`,
          style: 'medium' as const,
        }
      case 'speed':
        return {
          text: `⚡ ready in ${primary.value}`,
          style: 'low' as const,
        }
      default:
        return null
    }
  }

  const content = getContent()
  if (!content) return null

  // BASE + VARIANT STYLES
  const base =
    'inline-flex items-center px-3.5 py-1.5 rounded-full text-[12px] font-medium tracking-[-0.01em] backdrop-blur-md transition-all duration-300 animate-[fadeInUp_0.4s_ease]'

  const variants = {
    high: 'bg-[#ffedd5] text-[#9a3412] border border-[#fdba74]/50',
    medium: 'bg-black/[0.05] text-[#1c1917]/80 border border-black/[0.06]',
    low: 'bg-black/[0.03] text-[#1c1917]/60 border border-black/[0.05]',
  }

  return (
    <div
      className={`${base} ${variants[content.style]}`}
      style={{
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {content.text}
    </div>
  )
}
