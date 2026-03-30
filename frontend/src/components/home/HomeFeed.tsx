'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { booksApi, demandApi, type BookResponse, type BookRequestResponse } from '../../utils/api'
import styles from './HomeFeed.module.css'

const formatInr = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export default function HomeFeed() {
  const [books, setBooks] = useState<BookResponse[]>([])
  const [looking, setLooking] = useState<BookRequestResponse[]>([])
  const [booksLoading, setBooksLoading] = useState(true)
  const [lookingLoading, setLookingLoading] = useState(true)
  const [booksError, setBooksError] = useState<string | null>(null)
  const [lookingError, setLookingError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setBooksLoading(true)
        setBooksError(null)
        const data = await booksApi.list({ page: 0, size: 8 })
        if (!cancelled) setBooks(data)
      } catch {
        if (!cancelled) setBooksError('Could not load listings')
      } finally {
        if (!cancelled) setBooksLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLookingLoading(true)
        setLookingError(null)
        const data = await demandApi.getOpenRequests()
        if (!cancelled) setLooking(data.slice(0, 8))
      } catch {
        if (!cancelled) setLookingError('Could not load posts')
      } finally {
        if (!cancelled) setLookingLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className={styles.feed} aria-label="What is moving on the platform">
      <div className={styles.feedGrid}>
        <div className={styles.column}>
          <header className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>Available now</h2>
            <p className={styles.columnLead}>Books others have put into the pool.</p>
            <Link href="/books" className={styles.columnLink}>
              See all
            </Link>
          </header>
          {booksLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : booksError ? (
            <p className={styles.muted}>{booksError}</p>
          ) : books.length === 0 ? (
            <p className={styles.muted}>Nothing listed yet — be the first to offer one.</p>
          ) : (
            <ul className={styles.list}>
              {books.map((b) => {
                const cover = b.imageUrl || b.thumbnailUrl
                const price = typeof b.price === 'number' ? b.price : 0
                return (
                  <li key={b.id}>
                    <Link href={`/books/${b.id}`} className={styles.row}>
                      <div className={styles.thumb} aria-hidden>
                        {cover ? (
                          <img src={cover} alt="" className={styles.thumbImg} referrerPolicy="no-referrer" />
                        ) : (
                          <span className={styles.thumbFallback}>{b.title.slice(0, 1)}</span>
                        )}
                      </div>
                      <div className={styles.rowBody}>
                        <span className={styles.rowTitle}>{b.title}</span>
                        <span className={styles.rowMeta}>
                          {b.author} · {formatInr(price)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className={styles.column}>
          <header className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>People are looking for</h2>
            <p className={styles.columnLead}>Normal part of the flow — not a special ask.</p>
            <Link href="/books#community-gets" className={styles.columnLink}>
              See all
            </Link>
          </header>
          {lookingLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : lookingError ? (
            <p className={styles.muted}>{lookingError}</p>
          ) : looking.length === 0 ? (
            <p className={styles.muted}>No open posts right now.</p>
          ) : (
            <ul className={styles.list}>
              {looking.map((r) => (
                <li key={r.id}>
                  <Link href="/books#community-gets" className={styles.row}>
                    <div className={styles.lookingBadge} aria-hidden>
                      ◇
                    </div>
                    <div className={styles.rowBody}>
                      <span className={styles.rowTitle}>{r.title}</span>
                      <span className={styles.rowMeta}>
                        {r.author}
                        {r.genre ? ` · ${r.genre}` : ''}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
