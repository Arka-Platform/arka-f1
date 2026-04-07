import Image from 'next/image'
import Link from 'next/link'
import { Flame, ShieldCheck, Star, ChevronRight } from 'lucide-react'
import type { BookResponse, ListingResponse } from '../../utils/api'
import { buildTagPair, buildTagPairFromBook } from './circulationData'
import styles from './circulation.module.css'

export type CirculationCardVariant = 'feature' | 'side'

export type CirculationBookCardProps =
  | {
      kind: 'listing'
      listing: ListingResponse
      requestCount: number
      circulationCount: number
      ownerFirstName: string
      ownerAvatarUrl: string
      ratingDisplay: string
      trustScore: number
      variant: CirculationCardVariant
      priority?: boolean
      selected?: boolean
      onSelect?: () => void
      passed?: boolean
      active?: boolean
    }
  | {
      kind: 'catalog'
      book: BookResponse
      requestCount: number
      circulationCount: number
      ownerFirstName: string
      ownerAvatarUrl: string
      ratingDisplay: string
      trustScore: number
      variant: CirculationCardVariant
      priority?: boolean
      selected?: boolean
      onSelect?: () => void
      passed?: boolean
      active?: boolean
    }

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=520&fit=crop&q=80'

export default function CirculationBookCard(props: CirculationBookCardProps) {
  const {
    variant,
    priority,
    selected,
    onSelect,
    passed,
    active,
  } = props

  const isFeature = variant === 'feature'
  const cardClass = isFeature ? `${styles.card} ${styles.cardFeature}` : `${styles.card} ${styles.cardSide}`
  const tagClass = `${styles.tag} ${styles.tagLight}`
  const starSize = isFeature ? 15 : 13
  const trustSize = isFeature ? 14 : 12
  const chevronSize = isFeature ? 18 : 16

  const title = props.kind === 'listing' ? props.listing.title : props.book.title
  const author = props.kind === 'listing' ? props.listing.author : props.book.author
  const coverSrc =
    props.kind === 'listing'
      ? props.listing.coverUrl?.trim() || PLACEHOLDER
      : props.book.imageUrl || props.book.thumbnailUrl || PLACEHOLDER
  const useUnoptimized = coverSrc.startsWith('http') && !coverSrc.includes('localhost')
  const [tagA, tagB] = props.kind === 'listing' ? buildTagPair(props.listing) : buildTagPairFromBook(props.book)
  const detailHref =
    props.kind === 'listing'
      ? `/three/listings/${props.listing.listingId}`
      : `/exchange?search=${encodeURIComponent(props.book.title)}`

  return (
    <article
      className={`${cardClass} ${active ? styles.cardActive : ''} ${selected ? styles.cardSelected : ''} ${
        passed ? styles.cardPassed : ''
      }`.trim()}
      role="listitem"
      data-variant={variant}
      data-circ-card="true"
      onClick={onSelect}
    >
      <div className={styles.requestsRow}>
        <Flame size={isFeature ? 15 : 13} strokeWidth={1.75} className={styles.flameIcon} fill="currentColor" aria-hidden />
        <span>
          {props.requestCount} {props.requestCount === 1 ? 'request' : 'requests'}
        </span>
      </div>

      <div className={styles.imageWrap}>
        <Image
          src={coverSrc}
          alt={`${title} by ${author}`}
          fill
          className={styles.imageFill}
          sizes="(max-width: 767px) min(calc(100vw - 5rem), 18rem), min(24vw, 18rem)"
          priority={priority}
          unoptimized={useUnoptimized}
        />
      </div>

      <div className={styles.cardBody}>
        <h2 className={styles.titleSerif}>{title}</h2>
        <p className={styles.author}>{author}</p>

        <div className={styles.tags}>
          <span className={tagClass}>{tagA}</span>
          <span className={tagClass}>{tagB}</span>
        </div>

        <div className={styles.starRow}>
          <Star size={starSize} strokeWidth={1.5} className={styles.starIcon} fill="currentColor" aria-hidden />
          <span>{props.ratingDisplay}</span>
          <span className={styles.circulations}>
            {props.circulationCount} {props.circulationCount === 1 ? 'circulation' : 'circulations'}
          </span>
        </div>
      </div>

      <div className={styles.footerRow}>
        <div className={styles.footerLeft}>
          <Image
            src={props.ownerAvatarUrl}
            alt=""
            width={32}
            height={32}
            className={styles.avatar}
            unoptimized
          />
          <p className={styles.offeredStrong}>
            Offered by <strong>{props.ownerFirstName}</strong>
          </p>
        </div>
        <div className={styles.footerMeta} onClick={(e) => e.stopPropagation()}>
          <span className={styles.camCount} title="Trust score">
            <ShieldCheck size={trustSize} strokeWidth={1.5} className={styles.iconMuted} aria-hidden />
            {props.trustScore}
          </span>
          <Link href={detailHref} className={styles.listingLink} aria-label={`Open ${title}`}>
            <ChevronRight size={chevronSize} strokeWidth={1.5} className={styles.chevronRight} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}
