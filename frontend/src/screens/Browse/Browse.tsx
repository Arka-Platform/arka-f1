'use client'

import React, { useCallback, useEffect, useState } from 'react'
import styles from './Browse.module.css'
import { booksApi, wishlistApi, type BookResponse } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'

function statusLine(b: BookResponse): string {
  const rating =
    b.averageRating != null ? `${b.averageRating.toFixed(1)}★` : null
  const rc = b.ratingsCount != null ? `${b.ratingsCount.toLocaleString('en-IN')} ratings` : null
  const tail = [rating, rc].filter(Boolean).join(' · ')
  return tail ? `${b.status} · ${tail}` : b.status
}

const Browse: React.FC = () => {
  const { user } = useAuth()

  const [books, setBooks] = useState<BookResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => new Set())

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

  useEffect(() => {
    if (!user?.id) {
      setWishlistIds(new Set())
      return
    }
    let cancelled = false
    wishlistApi
      .getWishlist(user.id)
      .then((items) => {
        if (!cancelled) setWishlistIds(new Set(items.map((i) => i.bookId)))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const toggleWishlist = useCallback(
    async (bookId: string) => {
      if (!user?.id) return
      const inList = wishlistIds.has(bookId)
      try {
        if (inList) {
          await wishlistApi.removeFromWishlist(user.id, bookId)
        } else {
          await wishlistApi.addToWishlist(user.id, bookId)
        }
        setWishlistIds((prev) => {
          const next = new Set(prev)
          if (inList) next.delete(bookId)
          else next.add(bookId)
          return next
        })
      } catch {
        /* keep UI stable */
      }
    },
    [user?.id, wishlistIds]
  )

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Browse books</h1>
            <p className={styles.subtitle}>Simple list view (cards removed).</p>
          </div>
        </header>

        {loading ? <p className={styles.status}>Loading books…</p> : null}
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
            const inWishlist = wishlistIds.has(b.id)
            return (
              <div key={b.id} className={styles.tileCell}>
                <div
                  className={styles.simpleRow}
                  role="group"
                  aria-label={`Book ${b.title}`}
                >
                  <div className={styles.simpleMain} role="presentation">
                    <div className={styles.simpleTitle}>{b.title}</div>
                    <div className={styles.simpleMeta}>
                      <span>{b.author}</span>
                      <span>•</span>
                      <span>{statusLine(b)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.simpleWish}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    onClick={() => void toggleWishlist(b.id)}
                    disabled={!user?.id}
                  >
                    {inWishlist ? '♥' : '♡'}
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default Browse
