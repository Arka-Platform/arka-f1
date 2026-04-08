import Image from 'next/image'
import Link from 'next/link'
import { Flame, ShieldCheck, Star, ChevronRight, ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import type { BookResponse, ListingResponse } from '../../utils/api'
import { buildTagPair, buildTagPairFromBook } from './circulationData'
import styles from './circulation.module.css'

export type CirculationCardVariant = 'feature' | 'side'

type BaseCardProps = {
  variant: CirculationCardVariant
  priority?: boolean
  selected?: boolean
  onSelect?: () => void
  passed?: boolean
  active?: boolean
  onPick?: () => void
  onPass?: () => void
}

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
    } & BaseCardProps
  | {
      kind: 'catalog'
      book: BookResponse
      requestCount: number
      circulationCount: number
      ownerFirstName: string
      ownerAvatarUrl: string
      ratingDisplay: string
      trustScore: number
    } & BaseCardProps

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
    onPick,
    onPass,
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
      ? `/exchange?search=${encodeURIComponent(props.listing.title)}`
      : `/exchange?search=${encodeURIComponent(props.book.title)}`
  const actionSize = isFeature ? 16 : 15

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
      {props.requestCount > 1 ? (
        <div className={styles.requestsRow}>
          <Flame
            size={isFeature ? 15 : 13}
            strokeWidth={1.75}
            className={styles.flameIcon}
            fill="currentColor"
            aria-hidden
          />
          <span>{props.requestCount} requests</span>
        </div>
      ) : null}

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
          {props.circulationCount > 1 ? (
            <span className={styles.circulations}>{props.circulationCount} circulations</span>
          ) : null}
        </div>
      </div>

      <div className={styles.primaryActions} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.pickBtn}
          onClick={onPick}
          disabled={!onPick}
          aria-label={`Pick ${title}`}
        >
          <ArrowDownToLine size={actionSize} strokeWidth={1.9} aria-hidden />
          Pick
        </button>
        <button
          type="button"
          className={styles.passBtn}
          onClick={onPass}
          disabled={!onPass}
          aria-label={`Pass ${title}`}
        >
          <ArrowUpToLine size={actionSize} strokeWidth={1.9} aria-hidden />
          Pass
        </button>
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
