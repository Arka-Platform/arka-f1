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

  const metaLabel = useMemo(() => {
    if (kind === 'listings') return 'Listings'
    if (kind === 'catalog') return 'Catalog'
    return 'Books'
  }, [kind])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <header className={styles.header}>
            <h1 className={styles.h1}>Circulation</h1>
            <div className={styles.sectionMeta}>
              <span className={styles.pill}>Loading</span>
            </div>
          </header>

          <section aria-busy="true" aria-label="Loading circulation from Supabase">
            <div className={styles.row} role="list">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`${styles.card} ${styles.skeleton}`} role="listitem" aria-hidden="true" />
              ))}
            </div>
          </section>
          <div className={styles.bottomSpace} aria-hidden="true" />
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
          <header className={styles.header}>
            <h1 className={styles.h1}>Circulation</h1>
          </header>
          <p className={styles.emptyText}>
            No books in circulation yet. List a book on Exchange or check back when the catalog is seeded.
          </p>
          <button type="button" className={styles.retryBtn} onClick={() => void load()}>
            Refresh
          </button>
          <div className={styles.bottomSpace} aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        {dndActive && (
          <p className={styles.dndHint} role="note">
            Drag a card to the bottom bar: My Shelf, Wishlist, or Cart.
          </p>
        )}
        <header className={styles.header}>
          <h1 className={styles.h1}>Circulation</h1>
          <div className={styles.sectionMeta} aria-label="Section filters">
            <span className={styles.pill}>{metaLabel}</span>
            <span className={styles.metaCount}>{n}</span>
          </div>
        </header>

        <section aria-label="Books">
          <div className={styles.row} role="list">
            {kind === 'listings' &&
              listings.map((listing, idx) =>
                wrapCard(
                  <CirculationBookCard {...cardPropsListing(listing, 'side', idx < 3)} />,
                  `circ-drag-${listing.listingId}`,
                  payloadFromListing(listing),
                ),
              )}
            {kind === 'catalog' &&
              books.map((book, idx) =>
                wrapCard(
                  <CirculationBookCard {...cardPropsCatalog(book, 'side', idx < 3)} />,
                  `circ-drag-book-${book.id}`,
                  payloadFromBook(book),
                ),
              )}
          </div>
        </section>

        <div className={styles.bottomSpace} aria-hidden="true" />
      </div>
    </div>
  )
}
