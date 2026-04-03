'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BookResponse, ListingResponse, SwapRequestCounts } from '../../utils/api'
import CirculationBookCard from './CirculationBookCard'
import { loadCirculationFromSupabase, ownerKeyForBook, type CirculationOwner } from './loadCirculationData'
import { avatarUrlForUserId, mediaCountForBook, mediaCountForListing } from './circulationData'
import styles from './circulation.module.css'

type LoadKind = 'listings' | 'catalog'

export default function CirculationView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<LoadKind | null>(null)
  const [listings, setListings] = useState<ListingResponse[]>([])
  const [books, setBooks] = useState<BookResponse[]>([])
  const [counts, setCounts] = useState<Record<string, SwapRequestCounts>>({})
  const [owners, setOwners] = useState<Record<string, CirculationOwner>>({})
  const [selectedIndex, setSelectedIndex] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await loadCirculationFromSupabase()
      if (data.kind === 'listings') {
        setKind('listings')
        setListings(data.listings)
        setCounts(data.counts)
        setBooks([])
        setOwners(data.owners)
      } else {
        setKind('catalog')
        setBooks(data.books)
        setListings([])
        setCounts({})
        setOwners(data.owners)
      }
      setSelectedIndex(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load from Supabase')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const n = kind === 'listings' ? listings.length : kind === 'catalog' ? books.length : 0

  const indices = useMemo(() => {
    if (n === 0) return { prev: -1, cur: -1, next: -1 }
    if (n === 1) return { prev: 0, cur: 0, next: 0 }
    const cur = Math.min(selectedIndex, n - 1)
    const prev = (cur - 1 + n) % n
    const next = (cur + 1) % n
    return { prev, cur, next }
  }, [n, selectedIndex])

  const goPrev = useCallback(() => {
    if (n <= 1) return
    setSelectedIndex((i) => (i - 1 + n) % n)
  }, [n])

  const goNext = useCallback(() => {
    if (n <= 1) return
    setSelectedIndex((i) => (i + 1) % n)
  }, [n])

  const cardPropsListing = useCallback(
    (listing: ListingResponse, variant: 'feature' | 'side', priority: boolean) => {
      const c = counts[listing.listingId] ?? { requestCount: 0, circulationCount: 0 }
      const o = owners[listing.ownerId] ?? {
        displayName: 'Reader',
        firstName: 'Reader',
        avatarUrl: avatarUrlForUserId(listing.ownerId),
        ratingDisplay: '4.0',
      }
      return {
        kind: 'listing' as const,
        listing,
        requestCount: c.requestCount,
        circulationCount: c.circulationCount,
        ownerFirstName: o.firstName,
        ownerAvatarUrl: o.avatarUrl,
        ratingDisplay: o.ratingDisplay,
        mediaCount: mediaCountForListing(listing),
        variant,
        priority,
      }
    },
    [counts, owners],
  )

  const cardPropsCatalog = useCallback(
    (book: BookResponse, variant: 'feature' | 'side', priority: boolean) => {
      const key = ownerKeyForBook(book)
      const o = owners[key] ?? {
        displayName: 'Community',
        firstName: 'Community',
        avatarUrl: avatarUrlForUserId(book.ownerId ?? 'catalog'),
        ratingDisplay: '4.0',
      }
      return {
        kind: 'catalog' as const,
        book,
        requestCount: 0,
        circulationCount: 0,
        ownerFirstName: o.firstName,
        ownerAvatarUrl: o.avatarUrl,
        ratingDisplay: o.ratingDisplay,
        mediaCount: mediaCountForBook(book),
        variant,
        priority,
      }
    },
    [owners],
  )

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <div className={styles.row} aria-busy="true" aria-label="Loading circulation from Supabase">
            <div className={`${styles.card} ${styles.cardSide} ${styles.skeleton}`} />
            <div className={`${styles.card} ${styles.cardFeature} ${styles.skeleton}`} />
            <div className={`${styles.card} ${styles.cardSide} ${styles.skeleton}`} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <p className={styles.errorText} role="alert">
            {error}
          </p>
          <button type="button" className={styles.retryBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (n === 0 || kind === null) {
    return (
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <p className={styles.emptyText}>
            No books in circulation yet. List a book on Exchange or check back when the catalog is seeded.
          </p>
          <button type="button" className={styles.retryBtn} onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>
    )
  }

  const single = n === 1

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        {n > 1 && (
          <div className={styles.carouselControls} aria-label="Browse books">
            <button type="button" className={styles.carouselBtn} onClick={goPrev} aria-label="Previous">
              ‹
            </button>
            <button type="button" className={styles.carouselBtn} onClick={goNext} aria-label="Next">
              ›
            </button>
          </div>
        )}
        <div className={styles.row} role="list">
          {!single && kind === 'listings' && (
            <CirculationBookCard {...cardPropsListing(listings[indices.prev], 'side', false)} />
          )}
          {!single && kind === 'catalog' && (
            <CirculationBookCard {...cardPropsCatalog(books[indices.prev], 'side', false)} />
          )}
          {kind === 'listings' && (
            <CirculationBookCard {...cardPropsListing(listings[indices.cur], 'feature', true)} />
          )}
          {kind === 'catalog' && (
            <CirculationBookCard {...cardPropsCatalog(books[indices.cur], 'feature', true)} />
          )}
          {!single && kind === 'listings' && (
            <CirculationBookCard {...cardPropsListing(listings[indices.next], 'side', false)} />
          )}
          {!single && kind === 'catalog' && (
            <CirculationBookCard {...cardPropsCatalog(books[indices.next], 'side', false)} />
          )}
        </div>
      </div>
    </div>
  )
}
