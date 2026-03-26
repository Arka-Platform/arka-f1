'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { listingsApi, type ListingResponse } from '../../../utils/api'
import ListingActionOverlay from '../../../components/books/overlay/ListingActionOverlay'

const ListingsBrowseScene = dynamic(() => import('../../../components/books/three/ListingsBrowseScene'), { ssr: false })

export default function ThreeBrowsePage() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingResponse[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)
      try {
        const data = await listingsApi.listActive({ limit: 12 })
        if (!mounted) return
        setListings(data)
      } catch (e: any) {
        if (!mounted) return
        setErrorMsg(e?.message || 'Failed to load listings')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const activeListing = useMemo(() => listings.find((l) => l.listingId === activeId) ?? null, [listings, activeId])
  const layoutId = activeId ? `listing-${activeId}` : 'listing-none'

  return (
    <div className="relative h-screen overflow-hidden bg-[#070A12]">
      {loading ? (
        <div className="absolute inset-0 z-[1] grid place-items-center text-white/80">
          Loading listings…
        </div>
      ) : null}
      {errorMsg ? (
        <div className="absolute left-6 top-6 z-[2] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
          {errorMsg}
        </div>
      ) : null}

      <ListingsBrowseScene
        listings={listings}
        activeListingId={activeId}
        onHoverChange={setActiveId}
        onSelectListing={(listingId) => router.push(`/three/listings/${listingId}`)}
      />

      <ListingActionOverlay
        activeListing={activeListing}
        layoutId={layoutId}
        onSelectDetail={(listingId) => router.push(`/three/listings/${listingId}`)}
      />
    </div>
  )
}

