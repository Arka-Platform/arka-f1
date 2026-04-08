import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { ShieldCheck, Star, X } from 'lucide-react'
import type { ListingResponse, SwapRequestCounts } from '../../utils/api'
import type { CirculationOwner } from './loadCirculationData'
import { formatCondition } from './circulationData'
import styles from './circulation.module.css'

type Props = {
  open: boolean
  title: string
  author: string
  bookHref: string
  listings: ListingResponse[]
  owners: Record<string, CirculationOwner>
  countsByListingId: Record<string, SwapRequestCounts>
  onClose: () => void
  onPickListing: (listing: ListingResponse) => void
  onPassListing: (listingId: string) => void
  passedListingIds: Set<string>
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function pct(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  return `${clamp(Math.round(n), 0, 100)}%`
}

export default function CirculationDetailsModal({
  open,
  title,
  author,
  bookHref,
  listings,
  owners,
  countsByListingId,
  onClose,
  onPickListing,
  onPassListing,
  passedListingIds,
}: Props) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const giverCount = listings.length
  const sorted = useMemo(() => {
    return [...listings].sort((a, b) => {
      const ca = countsByListingId[a.listingId]?.circulationCount ?? 0
      const cb = countsByListingId[b.listingId]?.circulationCount ?? 0
      if (cb !== ca) return cb - ca
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [listings, countsByListingId])

  if (!open) return null

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${title}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div className={styles.modalHeaderText}>
            <div className={styles.modalTitle}>{title}</div>
            <div className={styles.modalSubtitle}>
              {author} • {giverCount} giver{giverCount === 1 ? '' : 's'}
            </div>
          </div>
          <button ref={closeBtnRef} type="button" className={styles.modalClose} onClick={onClose} aria-label="Close details">
            <X size={18} strokeWidth={1.8} aria-hidden />
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.modalActionsRow}>
            <a className={styles.modalOpenLink} href={bookHref}>
              Open in Exchange
            </a>
          </div>

          <section className={styles.giversSection} aria-label="Givers">
            {sorted.map((l) => {
              const owner = owners[l.ownerId]
              const trust = owner?.trust ?? null
              const counts = countsByListingId[l.listingId] ?? { requestCount: 0, circulationCount: 0 }
              const passed = passedListingIds.has(l.listingId)
              const cover = l.coverUrl || l.conditionImageUrls[0] || null

              return (
                <article key={l.listingId} className={styles.giverCard} data-passed={passed ? 'true' : 'false'}>
                  <div className={styles.giverTop}>
                    <div className={styles.giverIdentity}>
                      <Image
                        src={owner?.avatarUrl ?? 'https://i.pravatar.cc/80?img=1'}
                        alt=""
                        width={40}
                        height={40}
                        className={styles.giverAvatar}
                        unoptimized
                      />
                      <div className={styles.giverText}>
                        <div className={styles.giverName}>{owner?.displayName ?? 'Reader'}</div>
                        <div className={styles.giverMeta}>
                          <span className={styles.giverMetaItem} title="Proximity Trust score">
                            <ShieldCheck size={14} strokeWidth={1.6} className={styles.iconMuted} aria-hidden />
                            {owner?.trustScore ?? 0}
                          </span>
                          <span className={styles.giverMetaItem} title="Rating">
                            <Star size={14} strokeWidth={1.6} className={styles.starIcon} fill="currentColor" aria-hidden />
                            {owner?.ratingDisplay ?? '4.0'}
                          </span>
                          <span className={styles.giverMetaItem}>{counts.circulationCount} circulations</span>
                          {counts.requestCount ? <span className={styles.giverMetaItem}>{counts.requestCount} requests</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className={styles.giverButtons}>
                      <button
                        type="button"
                        className={styles.giverPick}
                        onClick={() => onPickListing(l)}
                        disabled={passed}
                        aria-label={`Pick copy from ${owner?.firstName ?? 'giver'}`}
                      >
                        Pick this copy
                      </button>
                      <button
                        type="button"
                        className={styles.giverPass}
                        onClick={() => onPassListing(l.listingId)}
                        aria-label={`Pass copy from ${owner?.firstName ?? 'giver'}`}
                      >
                        Pass
                      </button>
                    </div>
                  </div>

                  <div className={styles.giverDetailsGrid} aria-label="Copy and contribution details">
                    <div className={styles.detailBlock}>
                      <div className={styles.detailBlockTitle}>Copy details (from provider add-book fields)</div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Condition</span>
                        <span className={styles.detailV}>{formatCondition(l.condition)}</span>
                      </div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Notes</span>
                        <span className={styles.detailV}>{l.askingNotes?.trim() ? l.askingNotes : '—'}</span>
                      </div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Tags</span>
                        <span className={styles.detailV}>{l.tags?.length ? l.tags.join(', ') : '—'}</span>
                      </div>
                      {cover ? (
                        <div className={styles.copyImageRow} aria-label="Copy images">
                          <Image src={cover} alt="" width={90} height={120} className={styles.copyThumb} unoptimized />
                          {l.conditionImageUrls.slice(0, 3).map((u) => (
                            <Image key={u} src={u} alt="" width={90} height={120} className={styles.copyThumb} unoptimized />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className={styles.detailBlock}>
                      <div className={styles.detailBlockTitle}>Proximity Trust score</div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Trust score</span>
                        <span className={styles.detailV}>{owner?.trustScore ?? 0}</span>
                      </div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Return rate</span>
                        <span className={styles.detailV}>{pct(trust?.returnRatePercent)}</span>
                      </div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Avg response</span>
                        <span className={styles.detailV}>
                          {typeof trust?.avgResponseHours === 'number' && Number.isFinite(trust.avgResponseHours)
                            ? `${Math.round(trust.avgResponseHours)}h`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.detailBlock}>
                      <div className={styles.detailBlockTitle}>Circulation contribution</div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Books shared</span>
                        <span className={styles.detailV}>{trust?.booksSharedCount ?? 0}</span>
                      </div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Completed transactions</span>
                        <span className={styles.detailV}>{trust?.completedTransactions ?? 0}</span>
                      </div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Condition accuracy</span>
                        <span className={styles.detailV}>
                          {typeof trust?.conditionAccuracyScore === 'number' && Number.isFinite(trust.conditionAccuracyScore)
                            ? `${Math.round(trust.conditionAccuracyScore)} / 100`
                            : '—'}
                        </span>
                      </div>
                      <div className={styles.detailLine}>
                        <span className={styles.detailK}>Show-up reliability</span>
                        <span className={styles.detailV}>
                          {typeof trust?.showupReliabilityScore === 'number' && Number.isFinite(trust.showupReliabilityScore)
                            ? `${Math.round(trust.showupReliabilityScore)} / 100`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        </div>
      </div>
    </div>
  )
}

