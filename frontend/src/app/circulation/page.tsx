'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import BookCard, { type CirculationBookCardModel } from '../../components/circulation/BookCard'
import BottomActionBar from '../../components/circulation/BottomActionBar'

function Header() {
  return (
    <header className="mx-auto w-full max-w-[420px] px-6 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-[26px] leading-[1.05] tracking-[-0.02em] text-[#2b2216]">
            arka’s
            <br />
            books
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/60 shadow-[0_16px_34px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] backdrop-blur transition active:scale-[0.99]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className="h-11 w-11 overflow-hidden rounded-full bg-[#d7cbb7] shadow-[0_16px_34px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
            <div className="grid h-full w-full place-items-center text-[12px] font-semibold text-[#2b2216]">U</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-[20px] leading-snug text-[#2b2216]">
        <span className="font-semibold">Books, shared.</span>{' '}
        <span className="font-serif italic text-[#6c5c45]">Stories, continued.</span>
      </p>
    </header>
  )
}

export default function CirculationPage() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [wish, setWish] = useState<Record<string, boolean>>({})

  const cards: CirculationBookCardModel[] = useMemo(
    () => [
      {
        id: 'midnight-library',
        coverUrl: null,
        title: 'The Midnight Library',
        author: 'Matt Haig',
        genre: 'Fiction',
        condition: 'Good Condition',
        rating: 4.4,
        circulationCount: 34,
        providerName: 'Rohan',
        providerTrustScore: 92,
        badge: { type: 'requests', text: '12 requests' },
        wishlisted: false,
      },
      {
        id: 'sapiens',
        coverUrl: null,
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        genre: 'Non-Fiction',
        condition: 'Like New',
        rating: 4.7,
        circulationCount: 51,
        providerName: 'Meera',
        providerTrustScore: 88,
        badge: { type: 'trending', text: 'Trending' },
        wishlisted: false,
      },
    ],
    []
  )

  const safeIdx = ((idx % cards.length) + cards.length) % cards.length
  const current = cards[safeIdx]
  const prev = cards[(safeIdx - 1 + cards.length) % cards.length]
  const next = cards[(safeIdx + 1) % cards.length]
  const wishlisted = Boolean(wish[current.id])

  const nextCard = () => setIdx((i) => i + 1)
  const prevCard = () => setIdx((i) => i - 1)

  return (
    <div className="min-h-[100dvh] bg-[#f7f5f2]">
      {/* soft calm backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(110%_90%_at_50%_0%,rgba(255,255,255,0.9),rgba(247,245,242,1)_60%)]" />

      <div className="relative">
        <Header />

        <main className="mx-auto w-full max-w-[420px] px-4 pb-[140px] pt-8">
          <div className="relative">
            {/* side cards (peek) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between">
              <div className="-ml-7 w-[78%] opacity-35 blur-[0.2px]">
                <BookCard model={{ ...prev, wishlisted: Boolean(wish[prev.id]) }} />
              </div>
              <div className="-mr-7 w-[78%] opacity-35 blur-[0.2px]">
                <BookCard model={{ ...next, wishlisted: Boolean(wish[next.id]) }} />
              </div>
            </div>

            {/* center dominant card */}
            <div className="relative z-10">
              <BookCard
                model={{ ...current, wishlisted }}
                onToggleWishlist={() => setWish((prev) => ({ ...prev, [current.id]: !prev[current.id] }))}
                onPick={nextCard}
                onPass={prevCard}
              />
            </div>
          </div>
        </main>

        <BottomActionBar
          active="pick"
          onPick={nextCard}
          onPass={prevCard}
          onWishlist={() => router.push('/wishlist')}
          onBookshelf={() => router.push('/bookshelf')}
        />
      </div>
    </div>
  )
}

