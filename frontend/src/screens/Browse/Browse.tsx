'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './Browse.module.css'
import { booksApi, type BookResponse } from '../../utils/api'

const formatInr = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

const Browse: React.FC = () => {
  const [books, setBooks] = useState<BookResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await booksApi.list({ page: 0, size: 24 })
        if (mounted) setBooks(data)
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load books')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Browse books</h1>
            <p className={styles.subtitle}>
              Clean collection layout with strong covers, quiet metadata, and generous spacing.
            </p>
          </div>
        </header>

        {loading ? (
          <p className={styles.status}>Loading books…</p>
        ) : null}
        {error ? (
          <p className={styles.statusError} role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && books.length === 0 ? (
          <p className={styles.status}>No books in the catalog yet.</p>
        ) : null}

        <section className={styles.grid}>
          {books.map((b) => {
            const cover = b.imageUrl || b.thumbnailUrl
            const price = typeof b.price === 'number' ? b.price : 0
            return (
              <Link key={b.id} href={`/books/${b.id}`} className={styles.card} aria-label={`View ${b.title}`}>
                <div className={styles.cover} role="presentation">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className={styles.coverImage}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className={cover ? styles.coverInnerOnImage : styles.coverInner}>
                    <div className={styles.coverTitle}>{b.title}</div>
                    <div className={styles.coverAuthor}>by {b.author}</div>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.rowTop}>
                    <div className={styles.metaBlock}>
                      <div className={styles.bookTitle}>{b.title}</div>
                      <div className={styles.bookAuthor}>{b.author}</div>
                    </div>
                    <div className={styles.price}>{formatInr(price)}</div>
                  </div>

                  <div className={styles.rowMid}>
                    <div className={styles.genre}>{b.genre ?? '—'}</div>
                    <div className={styles.rating}>
                      <span className={styles.star}>★</span>
                      <span className={styles.ratingValue}>
                        {b.averageRating != null ? b.averageRating.toFixed(1) : '—'}
                      </span>
                      {b.ratingsCount != null ? (
                        <span className={styles.ratingCount}>({b.ratingsCount.toLocaleString('en-IN')})</span>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.pills}>
                    <span className={styles.pill}>Status</span>
                    <span className={styles.pillValue}>{b.status}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default Browse
