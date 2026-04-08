'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { BookResponse, ListingResponse, SwapRequestCounts } from '../../utils/api'
import { bookshelfApi, wishlistApi } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { CirculationDragPayload } from '../../components/Layout/CirculationDndContext'
import { useCirculationActivePayload, useCirculationDndRegistration, useCirculationQuickActions } from '../../components/Layout/CirculationDndContext'
import CirculationBookCard from './CirculationBookCard'
import { CirculationDraggableWrap } from './CirculationDraggableWrap'
import { loadCirculationFromSupabase, ownerKeyForBook, type CirculationOwner } from './loadCirculationData'
import { avatarUrlForUserId, mediaCountForBook, mediaCountForListing } from './circulationData'
import styles from './circulation.module.css'

type LoadKind = 'listings' | 'catalog'

type SelectedKey =
  | { kind: 'listing'; id: string }
  | { kind: 'catalog'; id: string }
  | null

type SortKey = 'recommended' | 'title_asc' | 'price_asc' | 'price_desc' | 'newest' | 'requests_desc'

function normalizeLabel(v: string | null | undefined): string | null {
  const s = (v ?? '').trim()
  return s.length ? s : null
}

function sectionLabelForListing(l: ListingResponse): string {
  return (
    normalizeLabel(l.genre) ??
    normalizeLabel(l.category) ??
    normalizeLabel(l.subcategory) ??
    'Uncategorized'
  )
}

function sectionLabelForBook(b: BookResponse): string {
  return (
    normalizeLabel(b.genre) ??
    normalizeLabel(b.category) ??
    normalizeLabel(b.subcategory) ??
    'Uncategorized'
  )
}

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
  const { error: showError, showToastWithAction } = useToast()
  const { addToCart, removeFromCart } = useCart()
  const registerDrop = useCirculationDndRegistration()
  const setActivePayload = useCirculationActivePayload()
  const { registerPassHandler } = useCirculationQuickActions()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const dndActive = isMobile && !!user
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<LoadKind | null>(null)
  const [listings, setListings] = useState<ListingResponse[]>([])
  const [books, setBooks] = useState<BookResponse[]>([])
  const [counts, setCounts] = useState<Record<string, SwapRequestCounts>>({})
  const [owners, setOwners] = useState<Record<string, CirculationOwner>>({})
  const [selected, setSelected] = useState<SelectedKey>(null)
  const [activeRowKey, setActiveRowKey] = useState<string>('__all__')
  const [activeIndexByRow, setActiveIndexByRow] = useState<Record<string, number>>({})
  const [passedIds, setPassedIds] = useState<Set<string>>(() => new Set())

  const [query, setQuery] = useState<string>('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('recommended')
  const [hidePassed, setHidePassed] = useState<boolean>(false)

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
      setSelected(null)
      setActiveRowKey('__all__')
      setActiveIndexByRow({})
      setPassedIds(new Set())
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
          showToastWithAction(
            'Added to wishlist',
            'success',
            'Undo',
            () => {
              void wishlistApi.removeFromWishlist(user.id!, payload.bookId).finally(() => {
                window.dispatchEvent(new Event('wishlistUpdated'))
              })
            },
            4500,
          )
        } else if (target === 'shelf') {
          await bookshelfApi.addToBookshelf(user.id, payload.bookId)
          showToastWithAction(
            'Added to My Shelf',
            'success',
            'Undo',
            () => {
              void bookshelfApi.removeFromBookshelf(user.id!, payload.bookId)
            },
            4500,
          )
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
          showToastWithAction(
            'Picked',
            'success',
            'Undo',
            () => {
              removeFromCart(payload.bookId)
            },
            4500,
          )
        }
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Could not add book')
      }
    },
    [user?.id, addToCart, removeFromCart, showError, showToastWithAction],
  )

  useEffect(() => {
    registerDrop(handleDrop)
    return () => registerDrop(null)
  }, [registerDrop, handleDrop])

  const genreOptions = useMemo(() => {
    const labels =
      kind === 'listings'
        ? listings.map(sectionLabelForListing)
        : kind === 'catalog'
          ? books.map(sectionLabelForBook)
          : []
    return Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b))
  }, [kind, listings, books])

  const filteredListings = useMemo(() => {
    if (kind !== 'listings') return []
    const q = query.trim().toLowerCase()
    return listings
      .filter((l) => (hidePassed ? !passedIds.has(l.listingId) : true))
      .filter((l) => (genreFilter ? sectionLabelForListing(l) === genreFilter : true))
      .filter((l) => {
        if (!q) return true
        return `${l.title} ${l.author}`.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortKey === 'recommended') return 0 // already sorted by demand at load time
        if (sortKey === 'title_asc') return a.title.localeCompare(b.title)
        if (sortKey === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
        if (sortKey === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
        if (sortKey === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (sortKey === 'requests_desc') {
          const ca = counts[a.listingId]?.requestCount ?? 0
          const cb = counts[b.listingId]?.requestCount ?? 0
          return cb - ca
        }
        return 0
      })
  }, [kind, listings, query, genreFilter, sortKey, hidePassed, passedIds, counts])

  const filteredBooks = useMemo(() => {
    if (kind !== 'catalog') return []
    const q = query.trim().toLowerCase()
    return books
      .filter((b) => (hidePassed ? !passedIds.has(b.id) : true))
      .filter((b) => (genreFilter ? sectionLabelForBook(b) === genreFilter : true))
      .filter((b) => {
        if (!q) return true
        return `${b.title} ${b.author}`.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortKey === 'recommended') return 0
        if (sortKey === 'title_asc') return a.title.localeCompare(b.title)
        if (sortKey === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
        if (sortKey === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
        if (sortKey === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        return 0
      })
  }, [kind, books, query, genreFilter, sortKey, hidePassed, passedIds])

  const n = kind === 'listings' ? filteredListings.length : kind === 'catalog' ? filteredBooks.length : 0

  const sections = useMemo(() => {
    if (kind === 'listings') {
      const map = new Map<string, ListingResponse[]>()
      for (const l of filteredListings) {
        const label = sectionLabelForListing(l)
        const arr = map.get(label)
        if (arr) arr.push(l)
        else map.set(label, [l])
      }
      const out = Array.from(map.entries()).map(([label, items]) => ({ key: `genre:${label}`, label, items }))
      out.sort((a, b) => a.label.localeCompare(b.label))
      return {
        kind: 'listings' as const,
        rows: out.map((r) => ({ ...r, label: r.label })),
      }
    }
    if (kind === 'catalog') {
      const map = new Map<string, BookResponse[]>()
      for (const b of filteredBooks) {
        const label = sectionLabelForBook(b)
        const arr = map.get(label)
        if (arr) arr.push(b)
        else map.set(label, [b])
      }
      const out = Array.from(map.entries()).map(([label, items]) => ({ key: `genre:${label}`, label, items }))
      out.sort((a, b) => a.label.localeCompare(b.label))
      return { kind: 'catalog' as const, rows: out }
    }
    return { kind: null, rows: [] as any[] }
  }, [kind, filteredListings, filteredBooks])

  const activePayload = useMemo(() => {
    if (n <= 0 || kind === null) return null
    const rowKey = activeRowKey
    const idx = activeIndexByRow[rowKey] ?? 0
    const row = sections.rows.find((r: any) => r.key === rowKey) ?? sections.rows[0]
    if (!row) return null
    if (sections.kind === 'listings') {
      const l = (row.items as ListingResponse[])[idx]
      return l ? payloadFromListing(l) : null
    }
    if (sections.kind === 'catalog') {
      const b = (row.items as BookResponse[])[idx]
      return b ? payloadFromBook(b) : null
    }
    return null
  }, [n, kind, sections, activeRowKey, activeIndexByRow])

  useEffect(() => {
    setActivePayload(activePayload)
  }, [activePayload, setActivePayload])

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
        trustScore: mediaCountForListing(listing),
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
        trustScore: mediaCountForBook(book),
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

  const clearFilters = useCallback(() => {
    setQuery('')
    setGenreFilter('')
    setSortKey('recommended')
    setHidePassed(false)
  }, [])

  const selectedDetail = useMemo(() => {
    if (!selected) return null
    if (selected.kind === 'listing') {
      const l = listings.find((x) => x.listingId === selected.id)
      if (!l) return null
      return {
        kind: 'listing' as const,
        id: l.listingId,
        title: l.title,
        author: l.author,
        href: `/exchange?search=${encodeURIComponent(l.title)}`,
      }
    }
    const b = books.find((x) => x.id === selected.id)
    if (!b) return null
    return {
      kind: 'catalog' as const,
      id: b.id,
      title: b.title,
      author: b.author,
      href: `/exchange?search=${encodeURIComponent(b.title)}`,
    }
  }, [selected, listings, books])

  const handleSelect = useCallback((next: SelectedKey) => {
    setSelected((cur) => {
      if (!next) return null
      if (cur && cur.kind === next.kind && cur.id === next.id) return null
      return next
    })
  }, [])

  const updateActiveFromScroll = useCallback((rowKey: string) => {
    const row = rowRefs.current[rowKey]
    if (!row) return
    const cards = row.querySelectorAll<HTMLElement>(`[data-circ-card='true']`)
    if (cards.length === 0) return

    const rowLeft = row.getBoundingClientRect().left
    const targetX = rowLeft + 24
    let bestIdx = 0
    let bestDist = Number.POSITIVE_INFINITY
    cards.forEach((el, idx) => {
      const left = el.getBoundingClientRect().left
      const dist = Math.abs(left - targetX)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = idx
      }
    })
    setActiveRowKey(rowKey)
    setActiveIndexByRow((prev) => (prev[rowKey] === bestIdx ? prev : { ...prev, [rowKey]: bestIdx }))
  }, [])

  const advanceToIndex = useCallback(
    (rowKey: string, idx: number) => {
      const row = rowRefs.current[rowKey]
      if (!row) return
      const cards = row.querySelectorAll<HTMLElement>(`[data-circ-card='true']`)
      const el = cards[idx]
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    },
    [],
  )

  const handlePass = useCallback(() => {
    if (!kind || n <= 0) return
    const rowKey = activeRowKey
    const idx = activeIndexByRow[rowKey] ?? 0
    const row = sections.rows.find((r: any) => r.key === rowKey) ?? sections.rows[0]
    if (!row) return

    const id =
      sections.kind === 'listings'
        ? (row.items as ListingResponse[])[idx]?.listingId
        : (row.items as BookResponse[])[idx]?.id
    if (id) {
      setPassedIds((prev) => new Set(prev).add(id))
    }
    const prevIndex = idx
    const next = Math.min(idx + 1, row.items.length - 1)
    if (next !== idx) {
      setActiveRowKey(rowKey)
      setActiveIndexByRow((prev) => ({ ...prev, [rowKey]: next }))
      advanceToIndex(rowKey, next)
    }
    showToastWithAction(
      'Passed',
      'info',
      'Undo',
      () => {
        if (!id) return
        setPassedIds((prev) => {
          const nextSet = new Set(prev)
          nextSet.delete(id)
          return nextSet
        })
        setActiveRowKey(rowKey)
        setActiveIndexByRow((prev) => ({ ...prev, [rowKey]: prevIndex }))
        advanceToIndex(rowKey, prevIndex)
      },
      4500,
    )
  }, [kind, n, sections, activeRowKey, activeIndexByRow, advanceToIndex, showToastWithAction])

  useEffect(() => {
    registerPassHandler(() => handlePass())
    return () => registerPassHandler(null)
  }, [registerPassHandler, handlePass])

  useEffect(() => {
    if (!isMobile) return
    const first = sections.rows[0]?.key
    if (first) updateActiveFromScroll(first)
  }, [isMobile, sections.rows, updateActiveFromScroll])

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
          <div className={styles.controls} aria-label="Sort and filter">
            <div className={styles.controlsRow}>
              <div className={styles.searchWrap}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or author"
                  className={styles.searchInput}
                  aria-label="Search books"
                />
              </div>

              <div className={styles.selects}>
                <label className={styles.selectLabel}>
                  <span className={styles.selectText}>Genre</span>
                  <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={styles.select} aria-label="Filter by genre">
                    <option value="">All</option>
                    {genreOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.selectLabel}>
                  <span className={styles.selectText}>Sort</span>
                  <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={styles.select} aria-label="Sort results">
                    <option value="recommended">Recommended</option>
                    {kind === 'listings' ? <option value="requests_desc">Most requested</option> : null}
                    <option value="newest">Newest</option>
                    <option value="title_asc">Title: A–Z</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </label>
              </div>

              <label className={styles.checkbox}>
                <input type="checkbox" checked={hidePassed} onChange={(e) => setHidePassed(e.target.checked)} />
                Hide passed
              </label>

              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearFilters}
                disabled={!query && !genreFilter && sortKey === 'recommended' && !hidePassed}
              >
                Clear
              </button>
            </div>
          </div>
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

        <div className={styles.controls} aria-label="Sort and filter">
          <div className={styles.controlsRow}>
            <div className={styles.searchWrap}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or author"
                className={styles.searchInput}
                aria-label="Search books"
              />
            </div>

            <div className={styles.selects}>
              <label className={styles.selectLabel}>
                <span className={styles.selectText}>Genre</span>
                <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={styles.select} aria-label="Filter by genre">
                  <option value="">All</option>
                  {genreOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.selectLabel}>
                <span className={styles.selectText}>Sort</span>
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={styles.select} aria-label="Sort results">
                  <option value="recommended">Recommended</option>
                  {kind === 'listings' ? <option value="requests_desc">Most requested</option> : null}
                  <option value="newest">Newest</option>
                  <option value="title_asc">Title: A–Z</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </label>
            </div>

            <label className={styles.checkbox}>
              <input type="checkbox" checked={hidePassed} onChange={(e) => setHidePassed(e.target.checked)} />
              Hide passed
            </label>

            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearFilters}
              disabled={!query && !genreFilter && sortKey === 'recommended' && !hidePassed}
            >
              Clear
            </button>
          </div>
        </div>

        <section aria-label="Books" className={styles.genreSections}>
          {sections.rows.map((row: any) => (
            <section key={row.key} className={styles.genreSection} aria-label={row.label}>
              <div className={styles.genreHeader}>
                <h2 className={styles.genreTitle}>{row.label}</h2>
                <div className={styles.genreCount}>{row.items.length}</div>
              </div>
              <div
                ref={(el) => {
                  rowRefs.current[row.key] = el
                }}
                className={`${styles.row} ${styles.netflixRow}`.trim()}
                role="list"
                onScroll={() => {
                  if (!isMobile) return
                  window.requestAnimationFrame(() => updateActiveFromScroll(row.key))
                }}
                onPointerDown={() => {
                  if (!isMobile) return
                  setActiveRowKey(row.key)
                }}
              >
                {sections.kind === 'listings' &&
                  (row.items as ListingResponse[]).map((listing, idx) =>
                    wrapCard(
                      <CirculationBookCard
                        {...cardPropsListing(listing, 'side', idx < 3)}
                        selected={selected?.kind === 'listing' && selected.id === listing.listingId}
                        onSelect={() => handleSelect({ kind: 'listing', id: listing.listingId })}
                        passed={passedIds.has(listing.listingId)}
                        active={isMobile && activeRowKey === row.key && (activeIndexByRow[row.key] ?? 0) === idx}
                      />,
                      `circ-drag-${listing.listingId}`,
                      payloadFromListing(listing),
                    ),
                  )}
                {sections.kind === 'catalog' &&
                  (row.items as BookResponse[]).map((book, idx) =>
                    wrapCard(
                      <CirculationBookCard
                        {...cardPropsCatalog(book, 'side', idx < 3)}
                        selected={selected?.kind === 'catalog' && selected.id === book.id}
                        onSelect={() => handleSelect({ kind: 'catalog', id: book.id })}
                        passed={passedIds.has(book.id)}
                        active={isMobile && activeRowKey === row.key && (activeIndexByRow[row.key] ?? 0) === idx}
                      />,
                      `circ-drag-book-${book.id}`,
                      payloadFromBook(book),
                    ),
                  )}
              </div>
            </section>
          ))}
        </section>

        <section className={styles.detailPanel} aria-label="Book details" data-open={selectedDetail ? 'true' : 'false'}>
          {selectedDetail && (
            <div className={styles.detailInner}>
              <div className={styles.detailText}>
                <div className={styles.detailTitle}>{selectedDetail.title}</div>
                <div className={styles.detailAuthor}>{selectedDetail.author}</div>
              </div>
              <div className={styles.detailActions}>
                <Link href={selectedDetail.href} className={styles.detailLink}>
                  Open
                </Link>
                <button type="button" className={styles.detailClose} onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </section>

        <div className={styles.bottomSpace} aria-hidden="true" />
      </div>
    </div>
  )
}
