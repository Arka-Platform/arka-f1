'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import BookCard, { type CirculationBookCardModel } from '../../components/circulation/BookCard'
import BottomActionBar from '../../components/circulation/BottomActionBar'
import styles from './CirculationPage.module.css'

function Header() {
  return (
    <header className={`${styles.container} ${styles.header}`}>
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          arka’s
          <br />
          books
        </div>
        <div className={styles.headerActions}>
          <button type="button" aria-label="Notifications" className={styles.iconCircle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className={`${styles.iconCircle} ${styles.avatar}`} aria-label="Profile">
            <div className={styles.avatarInner}>U</div>
          </div>
        </div>
      </div>

      <p className={styles.headline}>
        <span className={styles.headlineStrong}>Books, shared.</span> <span className={styles.headlineEm}>Stories, continued.</span>
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
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.shell}>
        <Header />

        <main className={`${styles.container} ${styles.main}`}>
          <div className={styles.stack}>
            <div className={styles.peekRow} aria-hidden>
              <div className={styles.peekLeft}>
                <BookCard variant="peek" model={{ ...prev, wishlisted: Boolean(wish[prev.id]) }} />
              </div>
              <div className={styles.peekRight}>
                <BookCard variant="peek" model={{ ...next, wishlisted: Boolean(wish[next.id]) }} />
              </div>
            </div>

            <div className={styles.center}>
              <BookCard
                variant="center"
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

