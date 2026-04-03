'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BookResponse, ListingResponse, SwapRequestCounts } from '../../utils/api'
import { bookshelfApi, wishlistApi } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { CirculationDragPayload } from '../../components/Layout/CirculationDndContext'
import { useCirculationDndRegistration } from '../../components/Layout/CirculationDndContext'
import CirculationBookCard from './CirculationBookCard'
import { CirculationDraggableWrap } from './CirculationDraggableWrap'
import { loadCirculationFromSupabase, ownerKeyForBook, type CirculationOwner } from './loadCirculationData'
import { avatarUrlForUserId, mediaCountForBook, mediaCountForListing } from './circulationData'
import styles from './circulation.module.css'

type LoadKind = 'listings' | 'catalog'

function payloadFromListing(l: ListingResponse): CirculationDragPayload {
  return {
    bookId: l.bookId,
    title: l.title,
    author: l.author,
    price: l.price,
    imageUrl: l.coverUrl,
  }
}

function payloadFromBook(b: BookResponse): CirculationDragPayload {
  return {
    bookId: b.id,
    title: b.title,
    author: b.author,
    price: b.price ?? 0,
    imageUrl: b.imageUrl ?? b.thumbnailUrl,
  }
}

export default function CirculationView() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const { addToCart } = useCart()
  const registerDrop = useCirculationDndRegistration()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const dndActive = isMobile && !!user

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

  const handleDrop = useCallback(
    async (target: 'wishlist' | 'shelf' | 'cart', payload: CirculationDragPayload) => {
      if (!user?.id) {
        showError('Log in to save books')
        return
      }
      try {
        if (target === 'wishlist') {
          await wishlistApi.addToWishlist(user.id, payload.bookId)
          window.dispatchEvent(new Event('wishlistUpdated'))
          success('Added to wishlist')
        } else if (target === 'shelf') {
          await bookshelfApi.addToBookshelf(user.id, payload.bookId)
          success('Added to My Shelf')
        } else {
          addToCart({
            id: payload.bookId,
            title: payload.title,
            author: payload.author,
            description: '',
            price: payload.price,
            image: payload.imageUrl ?? undefined,
            thumbnail: payload.imageUrl ?? undefined,
            genre: '',
          })
          success('Added to cart')
        }
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Could not add book')
      }
    },
    [user?.id, addToCart, success, showError],
  )

  useEffect(() => {
    registerDrop(handleDrop)
    return () => registerDrop(null)
  }, [registerDrop, handleDrop])

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
        trustLine1: o.trustLine1,
        trustLine2: o.trustLine2,
        trustLine3: o.trustLine3,
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
        trustLine1: o.trustLine1,
        trustLine2: o.trustLine2,
        trustLine3: o.trustLine3,
      }
    },
    [owners],
  )

  const wrapCard = useCallback(
    (node: ReactNode, dragId: string, payload: CirculationDragPayload) => {
      if (!dndActive) return node
      return (
        <CirculationDraggableWrap id={dragId} payload={payload} disabled={false}>
          {node}
        </CirculationDraggableWrap>
      )
    },
    [dndActive],
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
        {dndActive && (
          <p className={styles.dndHint} role="note">
            Drag a card to the bottom bar: My Shelf, Wishlist, or Cart.
          </p>
        )}
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
          {!single && kind === 'listings' &&
            wrapCard(
              <CirculationBookCard {...cardPropsListing(listings[indices.prev], 'side', false)} />,
              `circ-drag-${listings[indices.prev].listingId}`,
              payloadFromListing(listings[indices.prev]),
            )}
          {!single && kind === 'catalog' &&
            wrapCard(
              <CirculationBookCard {...cardPropsCatalog(books[indices.prev], 'side', false)} />,
              `circ-drag-book-${books[indices.prev].id}-prev`,
              payloadFromBook(books[indices.prev]),
            )}
          {kind === 'listings' &&
            wrapCard(
              <CirculationBookCard {...cardPropsListing(listings[indices.cur], 'feature', true)} />,
              `circ-drag-${listings[indices.cur].listingId}`,
              payloadFromListing(listings[indices.cur]),
            )}
          {kind === 'catalog' &&
            wrapCard(
              <CirculationBookCard {...cardPropsCatalog(books[indices.cur], 'feature', true)} />,
              `circ-drag-book-${books[indices.cur].id}-cur`,
              payloadFromBook(books[indices.cur]),
            )}
          {!single && kind === 'listings' &&
            wrapCard(
              <CirculationBookCard {...cardPropsListing(listings[indices.next], 'side', false)} />,
              `circ-drag-${listings[indices.next].listingId}`,
              payloadFromListing(listings[indices.next]),
            )}
          {!single && kind === 'catalog' &&
            wrapCard(
              <CirculationBookCard {...cardPropsCatalog(books[indices.next], 'side', false)} />,
              `circ-drag-book-${books[indices.next].id}-next`,
              payloadFromBook(books[indices.next]),
            )}
        </div>
      </div>
    </div>
  )
}
