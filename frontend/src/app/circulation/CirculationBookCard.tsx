import Image from 'next/image'
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
      mediaCount: number
      variant: CirculationCardVariant
      priority?: boolean
      selected?: boolean
      onSelect?: () => void
    }
  | {
      kind: 'catalog'
      book: BookResponse
      requestCount: number
      circulationCount: number
      ownerFirstName: string
      ownerAvatarUrl: string
      ratingDisplay: string
      mediaCount: number
      variant: CirculationCardVariant
      priority?: boolean
      selected?: boolean
      onSelect?: () => void
    }

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=520&fit=crop&q=80'

export default function CirculationBookCard(props: CirculationBookCardProps) {
  const {
    variant,
    priority,
    selected,
    onSelect,
  } = props

  const title = props.kind === 'listing' ? props.listing.title : props.book.title
  const author = props.kind === 'listing' ? props.listing.author : props.book.author
  const coverSrc =
    props.kind === 'listing'
      ? props.listing.coverUrl?.trim() || PLACEHOLDER
      : props.book.imageUrl || props.book.thumbnailUrl || PLACEHOLDER
  const useUnoptimized = coverSrc.startsWith('http') && !coverSrc.includes('localhost')
  const [tagA] = props.kind === 'listing' ? buildTagPair(props.listing) : buildTagPairFromBook(props.book)

  return (
    <article
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`.trim()}
      role="listitem"
      data-variant={variant}
      data-circ-card="true"
    >
      <button type="button" className={styles.cardBtn} onClick={onSelect} aria-pressed={selected} aria-label={title}>
        <div className={styles.imageWrap}>
          <Image
            src={coverSrc}
            alt={`${title} by ${author}`}
            fill
            className={styles.imageFill}
            sizes="160px"
            priority={priority}
            unoptimized={useUnoptimized}
          />
          <div className={styles.hoverOverlay} aria-hidden="true">
            <div className={styles.hoverTitle}>{title}</div>
          </div>
        </div>

        <div className={styles.cardText}>
          <h2 className={styles.titleSerif}>{title}</h2>
          <p className={styles.author}>{author}</p>
          <p className={styles.microTag} aria-hidden="true">
            {tagA}
          </p>
        </div>
      </button>
    </article>
  )
}
