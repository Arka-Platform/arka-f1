'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { listingsApi, marketplaceApi, swapRequestsApi, trustScoreApi, usersApi, wishlistApi, booksApi, type SwapRequestStatus } from '../../utils/api'
import CirculateBookCard, { type CirculateBookCardModel } from '../../components/circulate/CirculateBookCard'

export default function CirculatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CirculateBookCardModel[]>([])

  const [busyPickListingId, setBusyPickListingId] = useState<string | null>(null)
  const [busyPassBookId, setBusyPassBookId] = useState<string | null>(null)
  const [busyWishlistBookId, setBusyWishlistBookId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        setLoading(true)

        // 1) Load feed listings (nearby if possible, otherwise active listings).
        let nearbyListings: Array<any> = []
        try {
          nearbyListings = await listingsApi.searchNearby({ radiusKm: 10, limit: 30, offset: 0 })
        } catch {
          // It's fine if geo isn't set yet or RPC fails; we fall back to listActive below.
        }

        const baseListings = (nearbyListings?.length ? nearbyListings : await listingsApi.listActive({ limit: 30 })) as any[]

        // Fallback: if there are no active `book_listings`, show the catalog books
        // so users don't see an empty `/books` page.
        if (!baseListings.length) {
          const fallbackBooks = await booksApi.list({ page: 0, size: 30 })

          const ownerIds = Array.from(new Set(fallbackBooks.map((b) => b.ownerId).filter(Boolean))) as string[]
          let wishlistSet = new Set<string>()
          if (user?.id) {
            const wishlist = await wishlistApi.getWishlist(user.id)
            wishlistSet = new Set(wishlist.map((i) => i.bookId))
          }

          const ownerCache = new Map<string, { providerName: string; providerTrustScore: number | null }>()
          await Promise.all(
            ownerIds.map(async (oid) => {
              try {
                const [profile, trust] = await Promise.all([usersApi.getById(oid), trustScoreApi.getTrustScore(oid).catch(() => null)])
                const providerName =
                  `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email?.split('@')[0] || 'Reader'
                ownerCache.set(oid, { providerName, providerTrustScore: trust?.trustScore ?? null })
              } catch {
                ownerCache.set(oid, { providerName: 'Reader', providerTrustScore: null })
              }
            })
          )

          const nextCards: CirculateBookCardModel[] = fallbackBooks.map((b) => {
            const owner = b.ownerId ? ownerCache.get(b.ownerId) : undefined
            return {
              listingId: b.id,
              bookId: b.id,
              ownerId: b.ownerId ?? '',
              title: b.title,
              author: b.author,
              genre: b.genre,
              description: b.description ?? '',
              condition: 'good',
              tags: [],
              coverUrl: b.imageUrl ?? b.thumbnailUrl ?? null,
              distanceMeters: null,
              distanceKm: null,
              nearTag: null,
              requestCount: 0,
              circulationCount: 0,
              providerName: owner?.providerName ?? 'Reader',
              providerTrustScore: owner?.providerTrustScore ?? null,
              wishlistActive: wishlistSet.has(b.id),
              passActive: false,
              ownedInventoryBookId: null,
              pickActiveStatus: null,
              actionsEnabled: false,
            }
          })

          if (!mounted) return
          setCards(nextCards)
          return
        }

        const listingIds = baseListings.map((l) => l.listingId)
        const ownerIds = Array.from(new Set(baseListings.map((l) => l.ownerId).filter(Boolean)))
        const bookIds = Array.from(new Set(baseListings.map((l) => l.bookId).filter(Boolean)))

        // 2) Enrich missing fields when we used the nearby RPC.
        const needsBookEnrichment = baseListings.some((l) => !l.genre && !l.description)
        const bookById = needsBookEnrichment ? new Map((await booksApi.getManyByIds(bookIds)).map((b) => [b.id, b])) : new Map<string, any>()

        const enrichedListings = baseListings.map((l) => {
          const book = bookById.get(l.bookId)
          if (!book) return l
          return {
            ...l,
            genre: l.genre ?? book.genre,
            description: l.description ?? book.description,
            // BookResponse has `status`, but card only needs condition label + metadata.
            price: l.price ?? book.price ?? 0,
            category: l.category ?? book.category,
            subcategory: l.subcategory ?? book.subcategory,
            ownerId: l.ownerId ?? book.ownerId,
          }
        })

        // 3) Demand/popularity meta (swap_requests).
        const countsByListingId = await swapRequestsApi.getCountsByListingIds({ listingIds })

        // 4) User-specific meta.
        let wishlistSet = new Set<string>()
        if (user?.id) {
          const wishlist = await wishlistApi.getWishlist(user.id)
          wishlistSet = new Set(wishlist.map((i) => i.bookId))
        }

        let myLibrary = new Map<string, { inventoryBookId: string; listingStatus: string | null }>()
        if (user?.id) {
          const myItems = await marketplaceApi.getMyLibrary({ limit: 50, offset: 0, category: null })
          myLibrary = new Map(myItems.map((it) => [it.bookId, { inventoryBookId: it.inventoryId, listingStatus: it.listingStatus }]))
        }

        let pickStatuses: Record<string, SwapRequestStatus> = {}
        if (user?.id) {
          pickStatuses = await swapRequestsApi.getUserActiveStatusesByListingIds({
            userId: user.id,
            listingIds,
          })
        }

        // 5) Provider trust + display name.
        const ownerCache = new Map<string, { providerName: string; providerTrustScore: number | null }>()
        await Promise.all(
          ownerIds.map(async (oid) => {
            try {
              const [profile, trust] = await Promise.all([usersApi.getById(oid), trustScoreApi.getTrustScore(oid).catch(() => null)])
              const providerName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email?.split('@')[0] || 'Reader'
              ownerCache.set(oid, {
                providerName,
                providerTrustScore: trust?.trustScore ?? null,
              })
            } catch {
              ownerCache.set(oid, { providerName: 'Reader', providerTrustScore: null })
            }
          })
        )

        // 6) Build card models.
        const nextCards: CirculateBookCardModel[] = enrichedListings.map((l) => {
          const distanceMeters = typeof l.distanceMeters === 'number' ? l.distanceMeters : null
          const distanceKm = distanceMeters != null ? distanceMeters / 1000 : null

          const nearTag = distanceKm != null && distanceKm <= 5 ? 'Near you' : null

          const requestCount = countsByListingId[l.listingId]?.requestCount ?? 0
          const circulationCount = countsByListingId[l.listingId]?.circulationCount ?? 0

          const owner = ownerCache.get(l.ownerId) ?? { providerName: 'Reader', providerTrustScore: null }

          const myEntry = myLibrary.get(l.bookId)

          return {
            listingId: l.listingId,
            bookId: l.bookId,
            ownerId: l.ownerId,
            title: l.title,
            author: l.author,
            genre: l.genre,
            description: l.description ?? '',
            condition: l.condition,
            tags: Array.isArray(l.tags) ? l.tags : [],
            coverUrl: l.coverUrl ?? l.imageCoverUrl ?? null,
            distanceMeters,
            distanceKm,
            nearTag,
            requestCount,
            circulationCount,
            providerName: owner.providerName,
            providerTrustScore: owner.providerTrustScore,
            wishlistActive: wishlistSet.has(l.bookId),
            passActive: myEntry?.listingStatus === 'active',
            ownedInventoryBookId: myEntry?.inventoryBookId ?? null,
            pickActiveStatus: pickStatuses[l.listingId] ?? null,
          }
        })

        if (!mounted) return
        setCards(nextCards)
      } catch (err: any) {
        showError(err?.message || 'Failed to load Circulate feed')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void run()
    return () => {
      mounted = false
    }
  }, [user?.id, showError])

  const headerSubtitle = useMemo(() => {
    return user?.id
      ? 'Pick to take. Pass to give. Wishlist to save.'
      : 'Browse community listings. Log in to Pick, Pass, or Wishlist.'
  }, [user?.id])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[430px] flex-col px-3 pb-24 pt-4">
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Circulate</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{headerSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/inventory')}
            className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.18)]"
          >
            My Library
          </button>
        </header>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[210px] animate-pulse rounded-[1.35rem] bg-white ring-1 ring-slate-900/[0.06]"
              />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-[1.35rem] bg-white p-5 text-center ring-1 ring-slate-900/[0.06]">
            <p className="text-sm font-semibold text-slate-700">No listings found nearby.</p>
            <p className="mt-2 text-sm text-slate-500">Try again later or add your own book to start the circulation.</p>
            <button
              type="button"
              onClick={() => router.push('/inventory?focus=add')}
              className="mt-4 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_26px_-16px_rgba(16,185,129,0.45)]"
            >
              Add a book
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((c) => (
              <CirculateBookCard
                key={c.listingId}
                model={c}
                loadingPick={busyPickListingId === c.listingId}
                loadingPass={busyPassBookId === c.bookId}
                loadingWishlist={busyWishlistBookId === c.bookId}
                onPick={async () => {
                  if (!user?.id) return router.push('/login')
                  if (c.pickActiveStatus) return
                  setBusyPickListingId(c.listingId)
                  try {
                    await marketplaceApi.createSwapRequest({ listingId: c.listingId, message: null })
                    success('Pick requested. The owner will respond.')
                    setCards((prev) =>
                      prev.map((x) => (x.listingId === c.listingId ? { ...x, pickActiveStatus: 'pending' } : x))
                    )
                  } catch (err: any) {
                    showError(err?.message || 'Failed to pick')
                  } finally {
                    setBusyPickListingId(null)
                  }
                }}
                onPass={async () => {
                  if (!user?.id) return router.push('/login')
                  if (c.passActive) return
                  setBusyPassBookId(c.bookId)
                  try {
                    if (!c.ownedInventoryBookId) {
                      showError('Add this book to your library first, then give it to circulation.')
                      router.push('/inventory?focus=add')
                      return
                    }
                    const loc = await marketplaceApi.getMyUserLocation().catch(() => null)
                    await marketplaceApi.createSwapListing({
                      inventoryBookId: c.ownedInventoryBookId,
                      condition: c.condition,
                      tags: c.tags,
                      imageCoverUrl: c.coverUrl,
                      askingNotes: null,
                      latitude: loc?.latitude ?? null,
                      longitude: loc?.longitude ?? null,
                    })
                    success('You just gave it a spot in circulation.')
                    setCards((prev) =>
                      prev.map((x) => (x.bookId === c.bookId ? { ...x, passActive: true } : x))
                    )
                  } catch (err: any) {
                    showError(err?.message || 'Failed to pass')
                  } finally {
                    setBusyPassBookId(null)
                  }
                }}
                onToggleWishlist={async () => {
                  if (!user?.id) return router.push('/login')
                  setBusyWishlistBookId(c.bookId)
                  try {
                    if (c.wishlistActive) {
                      await wishlistApi.removeFromWishlist(user.id, c.bookId)
                      success('Removed from wishlist')
                    } else {
                      await wishlistApi.addToWishlist(user.id, c.bookId)
                      success('Saved to wishlist')
                    }
                    setCards((prev) =>
                      prev.map((x) => (x.bookId === c.bookId ? { ...x, wishlistActive: !c.wishlistActive } : x))
                    )
                  } catch (err: any) {
                    showError(err?.message || 'Wishlist update failed')
                  } finally {
                    setBusyWishlistBookId(null)
                  }
                }}
                onOpenMyLibrary={() => router.push('/inventory')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

