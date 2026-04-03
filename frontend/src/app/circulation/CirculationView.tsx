'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listingsApi,
  swapRequestsApi,
  trustScoreApi,
  usersApi,
  type ListingResponse,
  type SwapRequestCounts,
} from '../../utils/api'
import CirculationBookCard from './CirculationBookCard'
import {
  avatarUrlForUserId,
  displayNameFromProfile,
  firstNameOnly,
  mediaCountForListing,
  sortListingsByDemand,
  trustToRatingDisplay,
} from './circulationData'
import styles from './circulation.module.css'

type OwnerEnrichment = {
  displayName: string
  firstName: string
  avatarUrl: string
  ratingDisplay: string
}

export default function CirculationView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listings, setListings] = useState<ListingResponse[]>([])
  const [counts, setCounts] = useState<Record<string, SwapRequestCounts>>({})
  const [owners, setOwners] = useState<Record<string, OwnerEnrichment>>({})
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const raw = await listingsApi.listActive({ limit: 40 })
        if (cancelled) return
        if (raw.length === 0) {
          setListings([])
          setCounts({})
          setOwners({})
          return
        }

        const listingIds = raw.map((l) => l.listingId)
        const countMap = await swapRequestsApi.getCountsByListingIds({ listingIds })
        if (cancelled) return

        const sorted = sortListingsByDemand(raw, countMap)
        const ownerIds = [...new Set(sorted.map((l) => l.ownerId).filter(Boolean))]

        const ownerEntries = await Promise.all(
          ownerIds.map(async (oid) => {
            try {
              const [profile, trust] = await Promise.all([
                usersApi.getById(oid),
                trustScoreApi.getTrustScore(oid).catch(() => null),
              ])
              const displayName = displayNameFromProfile(profile.firstName, profile.lastName, profile.email)
              const firstName = firstNameOnly(profile.firstName, profile.lastName, displayName)
              const trustScore = trust?.trustScore ?? 0
              const ratingDisplay = trustToRatingDisplay(trustScore)
              const enrichment: OwnerEnrichment = {
                displayName,
                firstName,
                avatarUrl: avatarUrlForUserId(oid),
                ratingDisplay,
              }
              return [oid, enrichment] as const
            } catch {
              const fallback: OwnerEnrichment = {
                displayName: 'Community member',
                firstName: 'Reader',
                avatarUrl: avatarUrlForUserId(oid),
                ratingDisplay: '4.0',
              }
              return [oid, fallback] as const
            }
          }),
        )

        if (cancelled) return
        setListings(sorted)
        setCounts(countMap)
        setOwners(Object.fromEntries(ownerEntries))
        setSelectedIndex(0)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load circulation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const n = listings.length

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

  const cardProps = useCallback(
    (listing: ListingResponse, variant: 'feature' | 'side', priority: boolean) => {
      const c = counts[listing.listingId] ?? { requestCount: 0, circulationCount: 0 }
      const o = owners[listing.ownerId] ?? {
        displayName: 'Reader',
        firstName: 'Reader',
        avatarUrl: avatarUrlForUserId(listing.ownerId),
        ratingDisplay: '4.0',
      }
      return {
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

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <div className={styles.row} aria-busy="true" aria-label="Loading listings">
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
        </div>
      </div>
    )
  }

  if (n === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <p className={styles.emptyText}>No active listings yet. Check back when readers list books for exchange.</p>
        </div>
      </div>
    )
  }

  const left = listings[indices.prev]
  const center = listings[indices.cur]
  const right = listings[indices.next]
  const single = n === 1

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        {n > 1 && (
          <div className={styles.carouselControls} aria-label="Browse listings">
            <button type="button" className={styles.carouselBtn} onClick={goPrev} aria-label="Previous listing">
              ‹
            </button>
            <button type="button" className={styles.carouselBtn} onClick={goNext} aria-label="Next listing">
              ›
            </button>
          </div>
        )}
        <div className={styles.row} role="list">
          {!single && (
            <CirculationBookCard {...cardProps(left, 'side', false)} />
          )}
          <CirculationBookCard {...cardProps(center, 'feature', true)} />
          {!single && (
            <CirculationBookCard {...cardProps(right, 'side', false)} />
          )}
        </div>
      </div>
    </div>
  )
}
