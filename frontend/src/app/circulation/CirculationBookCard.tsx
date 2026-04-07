import Image from 'next/image'
import Link from 'next/link'
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
    }

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=520&fit=crop&q=80'

export default function CirculationBookCard(props: CirculationBookCardProps) {
  const {
    variant,
    priority,
  } = props

  const title = props.kind === 'listing' ? props.listing.title : props.book.title
  const author = props.kind === 'listing' ? props.listing.author : props.book.author
  const coverSrc =
    props.kind === 'listing'
      ? props.listing.coverUrl?.trim() || PLACEHOLDER
      : props.book.imageUrl || props.book.thumbnailUrl || PLACEHOLDER
  const useUnoptimized = coverSrc.startsWith('http') && !coverSrc.includes('localhost')
  const [tagA] = props.kind === 'listing' ? buildTagPair(props.listing) : buildTagPairFromBook(props.book)
  const detailHref =
    props.kind === 'listing'
      ? `/three/listings/${props.listing.listingId}`
      : `/exchange?search=${encodeURIComponent(props.book.title)}`

  return (
    <article className={styles.card} role="listitem" data-variant={variant}>
      <Link href={detailHref} className={styles.cardLink} aria-label={`Open ${title}`}>
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
        </div>

        <div className={styles.cardText}>
          <h2 className={styles.titleSerif}>{title}</h2>
          <p className={styles.author}>{author}</p>
          <p className={styles.microTag} aria-hidden="true">
            {tagA}
          </p>
        </div>
      </Link>
    </article>
  )
}
