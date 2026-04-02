'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { booksApi, trustScoreApi, usersApi, wishlistApi, type BookResponse } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import BumbleBookCard, { type BumbleBadge, type BumbleBook } from '../../components/books/BumbleBookCard'
import BumbleActionBar from '../../components/books/BumbleActionBar'

function toBadge(b: BookResponse): BumbleBadge | null {
  // Bumble-like: keep it light and dynamic (requests/near/trending would come from listings;
  // here we do simple "Trending" when ratingsCount is high.
  if (b.ratingsCount != null && b.ratingsCount >= 10) return { icon: 'trending', text: 'Trending' }
  return null
}

export default function BooksSwipe() {
  const router = useRouter()
  const { user } = useAuth()
  const { error: showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<BookResponse[]>([])
  const [idx, setIdx] = useState(0)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => new Set())

  const [providerByOwnerId, setProviderByOwnerId] = useState<
    Map<string, { name: string; trustScore: number | null }>
  >(() => new Map())

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await booksApi.list({ page: 0, size: 30 })
        if (mounted) setBooks(data)
      } catch (e: any) {
        showError(e?.message || 'Failed to load books')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [showError])

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

  useEffect(() => {
    // Provider info is optional; best-effort enrich for visible set.
    const ownerIds = Array.from(new Set(books.map((b) => b.ownerId).filter(Boolean))) as string[]
    if (ownerIds.length === 0) return

    let cancelled = false
    ;(async () => {
      const next = new Map(providerByOwnerId)
      await Promise.all(
        ownerIds.map(async (oid) => {
          if (next.has(oid)) return
          try {
            const [profile, trust] = await Promise.all([
              usersApi.getById(oid),
              trustScoreApi.getTrustScore(oid).catch(() => null),
            ])
            const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email?.split('@')[0] || 'Reader'
            next.set(oid, { name, trustScore: trust?.trustScore ?? null })
          } catch {
            next.set(oid, { name: 'Reader', trustScore: null })
          }
        })
      )
      if (!cancelled) setProviderByOwnerId(next)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books])

  const safeIdx = books.length ? ((idx % books.length) + books.length) % books.length : 0
  const current = books.length ? books[safeIdx] : null
  const prev = books.length ? books[(safeIdx - 1 + books.length) % books.length] : null
  const next = books.length ? books[(safeIdx + 1) % books.length] : null

  const toBumble = useMemo(() => {
    const mapOne = (b: BookResponse): BumbleBook => {
      const provider = (b.ownerId ? providerByOwnerId.get(b.ownerId) : undefined) ?? { name: 'Reader', trustScore: null }
      return {
        id: b.id,
        title: b.title,
        author: b.author,
        coverUrl: b.imageUrl ?? b.thumbnailUrl ?? null,
        genre: b.genre ?? null,
        condition: b.status ?? null,
        rating: b.averageRating ?? null,
        circulationCount: null,
        provider,
        badge: toBadge(b),
        wishlisted: wishlistIds.has(b.id),
      }
    }
    return { mapOne }
  }, [providerByOwnerId, wishlistIds])

  const pageBg =
    'bg-[radial-gradient(110%_90%_at_50%_0%,rgba(255,255,255,0.92),rgba(247,245,242,1)_60%)]'

  const nextCard = () => setIdx((i) => i + 1)

  const toggleWishlist = async (bookId: string) => {
    if (!user?.id) return router.push('/login')
    const inList = wishlistIds.has(bookId)
    try {
      if (inList) await wishlistApi.removeFromWishlist(user.id, bookId)
      else await wishlistApi.addToWishlist(user.id, bookId)
      setWishlistIds((prev) => {
        const n = new Set(prev)
        if (inList) n.delete(bookId)
        else n.add(bookId)
        return n
      })
      window.dispatchEvent(new CustomEvent('wishlistUpdated'))
    } catch (e: any) {
      showError(e?.message || 'Wishlist update failed')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f5f2]">
      <div className={`pointer-events-none fixed inset-0 ${pageBg}`} />

      <div className="relative mx-auto w-full max-w-[420px] px-4 pb-[140px] pt-7">
        <header className="px-2">
          <div className="flex items-start justify-between">
            <div className="font-serif text-[26px] leading-[1.05] tracking-[-0.02em] text-[#2b2216]">
              arka’s
              <br />
              books
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Wishlist"
                onClick={() => router.push('/wishlist')}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/60 shadow-[0_16px_34px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] backdrop-blur transition active:scale-[0.99]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="My bookshelf"
                onClick={() => router.push('/bookshelf')}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/60 shadow-[0_16px_34px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] backdrop-blur transition active:scale-[0.99]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#2b2216" strokeWidth="2" aria-hidden>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-5 text-[20px] leading-snug text-[#2b2216]">
            <span className="font-semibold">Books, shared.</span>{' '}
            <span className="font-serif italic text-[#6c5c45]">Choose your next read.</span>
          </p>
        </header>

        <div className="mt-7">
          {loading ? (
            <div className="rounded-[28px] bg-white/60 shadow-[0_28px_70px_rgba(35,25,12,0.12)] ring-1 ring-black/[0.035] backdrop-blur">
              <div className="aspect-[4/3] animate-pulse bg-[#efe8dd]" />
              <div className="p-6">
                <div className="h-6 w-2/3 animate-pulse rounded bg-black/10" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-black/10" />
                <div className="mt-4 flex gap-2">
                  <div className="h-7 w-20 animate-pulse rounded-full bg-black/10" />
                  <div className="h-7 w-28 animate-pulse rounded-full bg-black/10" />
                </div>
                <div className="mt-4 h-10 w-full animate-pulse rounded-full bg-black/10" />
              </div>
            </div>
          ) : !current || !prev || !next ? (
            <div className="rounded-[28px] bg-white/60 p-6 text-center shadow-[0_28px_70px_rgba(35,25,12,0.12)] ring-1 ring-black/[0.035] backdrop-blur">
              No books found.
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between" aria-hidden>
                <div className="-ml-7 w-[78%] opacity-30 blur-[0.2px]">
                  <BumbleBookCard variant="peek" book={toBumble.mapOne(prev)} />
                </div>
                <div className="-mr-7 w-[78%] opacity-30 blur-[0.2px]">
                  <BumbleBookCard variant="peek" book={toBumble.mapOne(next)} />
                </div>
              </div>

              <div className="relative z-10">
                <BumbleBookCard
                  variant="center"
                  book={toBumble.mapOne(current)}
                  onToggleWishlist={() => void toggleWishlist(current.id)}
                  onPick={() => router.push(`/books/${current.id}`)}
                  onPass={nextCard}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <BumbleActionBar
        onPass={nextCard}
        onPick={() => {
          if (current) router.push(`/books/${current.id}`)
        }}
        onWishlist={() => {
          if (current) void toggleWishlist(current.id)
        }}
      />
    </div>
  )
}

