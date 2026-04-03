import Image from 'next/image'
import Link from 'next/link'
import { Flame, Camera, Star, ChevronRight } from 'lucide-react'
import type { ListingResponse } from '../../utils/api'
import { buildTagPair } from './circulationData'
import styles from './circulation.module.css'

export type CirculationCardVariant = 'feature' | 'side'

export type CirculationBookCardProps = {
  listing: ListingResponse
  requestCount: number
  circulationCount: number
  ownerFirstName: string
  ownerAvatarUrl: string
  ratingDisplay: string
  mediaCount: number
  variant: CirculationCardVariant
  priority?: boolean
}

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=520&fit=crop&q=80'

export default function CirculationBookCard({
  listing,
  requestCount,
  circulationCount,
  ownerFirstName,
  ownerAvatarUrl,
  ratingDisplay,
  mediaCount,
  variant,
  priority,
}: CirculationBookCardProps) {
  const isFeature = variant === 'feature'
  const cardClass = isFeature ? `${styles.card} ${styles.cardFeature}` : `${styles.card} ${styles.cardSide}`
  const tagClass = `${styles.tag} ${styles.tagLight}`
  const starSize = isFeature ? 15 : 13
  const camSize = isFeature ? 14 : 12
  const chevronSize = isFeature ? 18 : 16

  const coverSrc = listing.coverUrl?.trim() || PLACEHOLDER
  const useUnoptimized = coverSrc.startsWith('http') && !coverSrc.includes('localhost')

  return (
    <article className={cardClass} role="listitem">
      <div className={styles.requestsRow}>
        <Flame size={isFeature ? 15 : 13} strokeWidth={1.75} className={styles.flameIcon} fill="currentColor" aria-hidden />
        <span>
          {requestCount} {requestCount === 1 ? 'request' : 'requests'}
        </span>
      </div>

      <div className={styles.imageWrap}>
        <Image
          src={coverSrc}
          alt={`${listing.title} by ${listing.author}`}
          fill
          className={styles.imageFill}
          sizes={isFeature ? '340px' : '280px'}
          priority={priority}
          unoptimized={useUnoptimized}
        />
      </div>

      <h2 className={styles.titleSerif}>{listing.title}</h2>
      <p className={styles.author}>{listing.author}</p>

      <div className={styles.tags}>
        {(() => {
          const [a, b] = buildTagPair(listing)
          return (
            <>
              <span className={tagClass}>{a}</span>
              <span className={tagClass}>{b}</span>
            </>
          )
        })()}
      </div>

      <div className={styles.starRow}>
        <Star size={starSize} strokeWidth={1.5} className={styles.starIcon} fill="currentColor" aria-hidden />
        <span>{ratingDisplay}</span>
        <span className={styles.circulations}>
          {circulationCount} {circulationCount === 1 ? 'circulation' : 'circulations'}
        </span>
      </div>

      <div className={styles.footerRow}>
        <div className={styles.footerLeft}>
          <Image
            src={ownerAvatarUrl}
            alt=""
            width={isFeature ? 36 : 32}
            height={isFeature ? 36 : 32}
            className={styles.avatar}
            unoptimized
          />
          <p className={styles.offeredStrong}>
            Offered by <strong>{ownerFirstName}</strong>
          </p>
        </div>
        <div className={styles.footerMeta}>
          <span className={styles.camCount} title="Listing photos">
            <Camera size={camSize} strokeWidth={1.5} className={styles.iconMuted} aria-hidden />
            {mediaCount}
          </span>
          <Link
            href={`/three/listings/${listing.listingId}`}
            className={styles.listingLink}
            aria-label={`Open ${listing.title}`}
          >
            <ChevronRight size={chevronSize} strokeWidth={1.5} className={styles.chevronRight} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}
