'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Browse.module.css'
import { booksApi, wishlistApi, type BookResponse } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import { BookTile, BookExpandedView, useBookInteractions } from '../../components/shared/BookScene'

const formatInr = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

function statusLine(b: BookResponse): string {
  const rating =
    b.averageRating != null ? `${b.averageRating.toFixed(1)}★` : null
  const rc = b.ratingsCount != null ? `${b.ratingsCount.toLocaleString('en-IN')} ratings` : null
  const tail = [rating, rc].filter(Boolean).join(' · ')
  return tail ? `${b.status} · ${tail}` : b.status
}

const Browse: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { iconAction } = useBookInteractions()

  const [books, setBooks] = useState<BookResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null)
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

  const expandedBook = expandedBookId ? books.find((b) => b.id === expandedBookId) : null

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Browse books</h1>
            <p className={styles.subtitle}>
              Tap a cover to open the full view — quick actions stay on the cover.
            </p>
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
            const cover = b.imageUrl || b.thumbnailUrl
            const inWishlist = wishlistIds.has(b.id)

            return (
              <div key={b.id} className={styles.tileCell}>
                <BookTile
                  title={b.title}
                  status={statusLine(b)}
                  image={cover}
                  imageAlt=""
                  onExpand={() => setExpandedBookId(b.id)}
                  onWishlist={user?.id ? () => void toggleWishlist(b.id) : undefined}
                  onLibrary={() => router.push(`/books/${b.id}`)}
                  onSwap={() => router.push('/exchange')}
                  wishlistActive={inWishlist}
                  iconAction={iconAction}
                  wishlistAriaLabel={user?.id ? 'Wishlist' : 'Sign in to use wishlist'}
                  libraryAriaLabel="Open book"
                  swapAriaLabel="Exchanges"
                />
              </div>
            )
          })}
        </section>
      </div>

      {expandedBook ? (
        <BookExpandedView
          open
          onClose={() => setExpandedBookId(null)}
          title={expandedBook.title}
          author={expandedBook.author}
          image={expandedBook.imageUrl || expandedBook.thumbnailUrl}
          imageAlt={expandedBook.title}
          genre={expandedBook.genre ?? undefined}
          condition={expandedBook.status}
          price={formatInr(typeof expandedBook.price === 'number' ? expandedBook.price : 0)}
          availability={
            expandedBook.averageRating != null
              ? `${expandedBook.averageRating.toFixed(1)}★${expandedBook.ratingsCount != null ? ` (${expandedBook.ratingsCount.toLocaleString('en-IN')})` : ''}`
              : undefined
          }
          ctaLabel="View this book"
          onCta={() => {
            const id = expandedBook.id
            setExpandedBookId(null)
            router.push(`/books/${id}`)
          }}
          showWishlist={!!user?.id}
          wishlistActive={wishlistIds.has(expandedBook.id)}
          onWishlistToggle={() => void toggleWishlist(expandedBook.id)}
        />
      ) : null}
    </div>
  )
}

export default Browse
