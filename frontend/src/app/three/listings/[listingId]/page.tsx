'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'

import { listingsApi, type ListingResponse } from '../../../../utils/api'
import ListingActionOverlay from '../../../../components/books/overlay/ListingActionOverlay'

const ListingDetailScene = dynamic(() => import('../../../../components/books/three/ListingDetailScene'), { ssr: false })

export default function ThreeListingDetailPage() {
  const params = useParams<{ listingId: string }>()
  const listingId = params.listingId

  const { scrollYProgress } = useScroll()
  const [listing, setListing] = useState<ListingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)
      try {
        const data = await listingsApi.getById(listingId)
        if (!mounted) return
        setListing(data)
      } catch (e: any) {
        if (!mounted) return
        setErrorMsg(e?.message || 'Failed to load listing')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [listingId])

  const layoutId = listing ? `listing-${listing.listingId}` : 'listing-none'

  const fade = useTransform(scrollYProgress, [0, 0.2], [0, 1])
  const y = useTransform(scrollYProgress, [0, 0.25], [18, 0])

  const images = useMemo(() => listing?.conditionImageUrls ?? [], [listing?.conditionImageUrls])

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white/80 grid place-items-center">
        {loading ? 'Loading…' : errorMsg || 'Not found'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070A12]">
      <div className="relative h-[58vh]">
        <ListingDetailScene listing={listing} scrollProgress={scrollYProgress} />
        <ListingActionOverlay activeListing={listing} layoutId={layoutId} />
      </div>

      <motion.section style={{ opacity: fade, y }} className="px-5 pb-16">
        <div className="mx-auto max-w-5xl pt-10">
          <div className="grid gap-3">
            <div className="grid gap-1">
              <div className="text-white text-xl font-semibold">{listing.title}</div>
              <div className="text-white/70 text-sm">by {listing.author}</div>
              <div className="text-white/60 text-xs mt-1">Condition: {listing.condition}</div>
              {listing.askingNotes ? <div className="text-white/70 text-sm mt-2">{listing.askingNotes}</div> : null}
            </div>

            <div className="mt-5 grid gap-3">
              <div className="text-white font-semibold">Condition images</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {images.length > 0 ? (
                  images.map((src) => (
                    <motion.img
                      key={src}
                      src={src}
                      alt="Condition"
                      className="h-64 w-full rounded-2xl object-cover border border-white/10 bg-white/5"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      loading="lazy"
                      decoding="async"
                    />
                  ))
                ) : (
                  <div className="h-64 rounded-2xl border border-white/10 bg-white/5 grid place-items-center text-white/60">
                    No condition images available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

