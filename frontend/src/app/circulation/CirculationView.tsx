'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BookResponse, ListingResponse, SwapRequestCounts } from '../../utils/api'
import { bookshelfApi, wishlistApi } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { CirculationDragPayload } from '../../components/Layout/CirculationDndContext'
import { useCirculationActivePayload, useCirculationDndRegistration, useCirculationQuickActions } from '../../components/Layout/CirculationDndContext'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import BookSearchInput from '../../components/shared/BookSearchInput/BookSearchInput'
import CirculationBookCard from './CirculationBookCard'
import CirculationDetailsModal from './CirculationDetailsModal'
import { CirculationDraggableWrap } from './CirculationDraggableWrap'
import { loadCirculationFromSupabase, ownerKeyForBook, type CirculationOwner } from './loadCirculationData'
import { avatarUrlForUserId, mediaCountForBook, mediaCountForListing } from './circulationData'
import styles from './circulation.module.css'

type LoadKind = 'listings' | 'catalog'

type SelectedKey = { kind: 'book'; bookId: string } | null

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
  }, [kind, listings, query, genreFilter, sortKey, counts])

  const filteredBooks = useMemo(() => {
    if (kind !== 'catalog') return []
    const q = query.trim().toLowerCase()
    return books
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
  }, [kind, books, query, genreFilter, sortKey])

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
      // One card per unique bookId (each book can have multiple active listings/copies).
      const out = Array.from(map.entries()).map(([label, items]) => {
        const byBook = new Map<string, ListingResponse[]>()
        for (const l of items) {
          const arr = byBook.get(l.bookId)
          if (arr) arr.push(l)
          else byBook.set(l.bookId, [l])
        }
        const groups = Array.from(byBook.entries()).map(([bookId, listings]) => ({
          bookId,
          listings,
          // Representative listing used for cover/title/author; per-copy selection happens in details modal.
          rep: listings[0]!,
        }))
        return { key: `genre:${label}`, label, items: groups }
      })
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
      const g = (row.items as Array<{ bookId: string; listings: ListingResponse[]; rep: ListingResponse }>)[idx]
      const l = g?.rep
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
    (
      group: { bookId: string; listings: ListingResponse[]; rep: ListingResponse },
      variant: 'feature' | 'side',
      priority: boolean,
    ) => {
      const rep = group.rep
      const totals = group.listings.reduce(
        (acc, l) => {
          const c = counts[l.listingId] ?? { requestCount: 0, circulationCount: 0 }
          acc.requestCount += c.requestCount
          acc.circulationCount += c.circulationCount
          return acc
        },
        { requestCount: 0, circulationCount: 0 },
      )
      const firstOwner = owners[rep.ownerId]
      const extra = group.listings.length - 1
      const ownerLabel = firstOwner?.firstName ?? 'Reader'
      const ownerFirstName = extra > 0 ? `${ownerLabel} +${extra}` : ownerLabel
      const ownerAvatarUrl = firstOwner?.avatarUrl ?? avatarUrlForUserId(rep.ownerId)
      const ratingDisplay = firstOwner?.ratingDisplay ?? '4.0'
      return {
        kind: 'listing' as const,
        listing: rep,
        requestCount: totals.requestCount,
        circulationCount: totals.circulationCount,
        ownerFirstName,
        ownerAvatarUrl,
        ratingDisplay,
        trustScore: mediaCountForListing(rep),
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
  }, [])

  const selectedDetail = useMemo(() => {
    if (!selected) return null
    if (kind === 'listings') {
      const groupListings = listings.filter((l) => l.bookId === selected.bookId)
      const rep = groupListings[0]
      if (!rep) return null
      return {
        bookId: selected.bookId,
        title: rep.title,
        author: rep.author,
        href: `/exchange?search=${encodeURIComponent(rep.title)}`,
        listings: groupListings,
      }
    }
    const b = books.find((x) => x.id === selected.bookId)
    if (!b) return null
    return {
      bookId: b.id,
      title: b.title,
      author: b.author,
      href: `/exchange?search=${encodeURIComponent(b.title)}`,
      listings: [],
    }
  }, [selected, kind, listings, books])

  const handleSelect = useCallback((next: SelectedKey) => {
    setSelected((cur) => {
      if (!next) return null
      if (cur && cur.bookId === next.bookId) return null
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

  const handlePickPayload = useCallback(
    (payload: CirculationDragPayload) => {
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
    },
    [addToCart, removeFromCart, showToastWithAction],
  )

  const handlePassId = useCallback(
    (id: string) => {
      setPassedIds((prev) => new Set(prev).add(id))
      showToastWithAction(
        'Passed',
        'info',
        'Undo',
        () => {
          setPassedIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        },
        4500,
      )
    },
    [showToastWithAction],
  )

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
          <div className={styles.heroSection} aria-label="Search books">
            <div className={styles.heroContent}>
              <div className={styles.heroHeader}>
                <h1 className={styles.heroH1}>Circulation</h1>
                <p className={styles.heroSubhead}>Browse what’s trending in the community. Pick what you want, pass what you don’t.</p>
                <p className={styles.heroKicker}>Keep Reading, Keep Passing.</p>
              </div>
              <div className={styles.heroSearchBar}>
                <BookSearchInput
                  value={query}
                  onChange={setQuery}
                  onBookSelect={(book) => {
                    if (book.genre) setGenreFilter(book.genre)
                    setQuery(book.title)
                  }}
                  placeholder="Search by title, author, ISBN…"
                  fullWidth
                />
              </div>

              <div className={styles.controls} aria-label="Sort and filter">
                <div className={styles.filtersRow}>
                  <Select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={styles.genreControl}>
                    <option value="">All genres</option>
                    {genreOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>

                  <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={styles.sortControl}>
                    <option value="recommended">Recommended</option>
                    {kind === 'listings' ? <option value="requests_desc">Most requested</option> : null}
                    <option value="newest">Newest</option>
                    <option value="title_asc">Title: A–Z</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </Select>

                  <div className={styles.filtersActions}>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={!query && !genreFilter && sortKey === 'recommended'}
                      className={styles.clearButton}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
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
        <div className={styles.heroSection} aria-label="Search books">
          <div className={styles.heroContent}>
            <div className={styles.heroHeader}>
              <h1 className={styles.heroH1}>Circulation</h1>
              <p className={styles.heroSubhead}>
                Browse what’s trending in the community. Pick what you want, pass what you don’t.
              </p>
              <div className={styles.heroMetaCenter} aria-label="Section filters">
                <span className={styles.pill}>{metaLabel}</span>
                <span className={styles.metaCount}>{n}</span>
              </div>
              <p className={styles.heroKicker}>Keep Reading, Keep Passing.</p>
            </div>
            <div className={styles.heroSearchBar}>
              <BookSearchInput
                value={query}
                onChange={setQuery}
                onBookSelect={(book) => {
                  if (book.genre) setGenreFilter(book.genre)
                  setQuery(book.title)
                }}
                placeholder="Search by title, author, ISBN…"
                fullWidth
              />
            </div>

            <div className={styles.controls} aria-label="Sort and filter">
              <div className={styles.filtersRow}>
                <Select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={styles.genreControl}>
                  <option value="">All genres</option>
                  {genreOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>

                <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={styles.sortControl}>
                  <option value="recommended">Recommended</option>
                  {kind === 'listings' ? <option value="requests_desc">Most requested</option> : null}
                  <option value="newest">Newest</option>
                  <option value="title_asc">Title: A–Z</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </Select>

                <div className={styles.filtersActions}>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!query && !genreFilter && sortKey === 'recommended'}
                    className={styles.clearButton}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {dndActive && (
          <p className={styles.dndHint} role="note">
            Drag a card to the bottom bar: My Shelf or Wishlist.
          </p>
        )}

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
                  (row.items as Array<{ bookId: string; listings: ListingResponse[]; rep: ListingResponse }>).map((group, idx) =>
                    wrapCard(
                      <CirculationBookCard
                        {...cardPropsListing(group, 'side', idx < 3)}
                        selected={selected?.kind === 'book' && selected.bookId === group.bookId}
                        onSelect={() => handleSelect({ kind: 'book', bookId: group.bookId })}
                        passed={group.listings.every((l) => passedIds.has(l.listingId))}
                        active={isMobile && activeRowKey === row.key && (activeIndexByRow[row.key] ?? 0) === idx}
                        onPass={() => {
                          if (group.listings.length <= 1) handlePassId(group.rep.listingId)
                          else handleSelect({ kind: 'book', bookId: group.bookId })
                        }}
                      />,
                      `circ-drag-${group.rep.listingId}`,
                      payloadFromListing(group.rep),
                    ),
                  )}
                {sections.kind === 'catalog' &&
                  (row.items as BookResponse[]).map((book, idx) =>
                    wrapCard(
                      <CirculationBookCard
                        {...cardPropsCatalog(book, 'side', idx < 3)}
                        selected={selected?.kind === 'book' && selected.bookId === book.id}
                        onSelect={() => handleSelect({ kind: 'book', bookId: book.id })}
                        passed={passedIds.has(book.id)}
                        active={isMobile && activeRowKey === row.key && (activeIndexByRow[row.key] ?? 0) === idx}
                        onPass={() => handlePassId(book.id)}
                      />,
                      `circ-drag-book-${book.id}`,
                      payloadFromBook(book),
                    ),
                  )}
              </div>
            </section>
          ))}
        </section>

        <CirculationDetailsModal
          open={!!selectedDetail && kind === 'listings'}
          title={selectedDetail?.title ?? ''}
          author={selectedDetail?.author ?? ''}
          listings={selectedDetail?.listings ?? []}
          owners={owners}
          countsByListingId={counts}
          passedListingIds={passedIds}
          onClose={() => setSelected(null)}
          onPickListing={(listing) => {
            handlePickPayload(payloadFromListing(listing))
            setSelected(null)
          }}
        />

        <div className={styles.bottomSpace} aria-hidden="true" />
      </div>
    </div>
  )
}
