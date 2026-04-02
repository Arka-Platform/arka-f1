'use client'

import React, { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ListingCondition, SwapRequestStatus } from '../../utils/api'
import styles from './CirculateBookCard.module.css'

export interface CirculateBookCardModel {
  listingId: string
  bookId: string
  ownerId: string

  title: string
  author: string
  genre: string | null
  description: string
  condition: ListingCondition
  tags: string[]
  coverUrl: string | null

  distanceMeters: number | null
  distanceKm: number | null
  nearTag: string | null

  requestCount: number
  circulationCount: number

  providerName: string
  providerTrustScore: number | null

  wishlistActive: boolean
  ownedInventoryBookId: string | null
  passActive: boolean
  pickActiveStatus: SwapRequestStatus | null

  /**
   * If false, the backend listing/workflow isn't available for this card.
   * We still allow details + wishlist, but we disable Pick/Pass to avoid failed actions.
   */
  actionsEnabled?: boolean
}

export interface CirculateBookCardProps {
  model: CirculateBookCardModel
  loadingPick?: boolean
  loadingPass?: boolean
  loadingWishlist?: boolean

  onPick: () => void | Promise<void>
  onPass: () => void | Promise<void>
  onToggleWishlist: () => void | Promise<void>
  onOpenMyLibrary: () => void
}

function initials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function trustPillClasses(score: number | null): string {
  if (score == null) return 'bg-slate-100 text-slate-700 ring-slate-200'
  if (score >= 85) return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
  if (score >= 70) return 'bg-amber-50 text-amber-900 ring-amber-200'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function conditionLabel(condition: string): string {
  const c = (condition ?? '').toLowerCase()
  if (!c) return 'Listed'
  return c
    .split('_')
    .join(' ')
    .replace(/\\b\\w/g, (m) => m.toUpperCase())
}

export default function CirculateBookCard({
  model,
  loadingPick = false,
  loadingPass = false,
  loadingWishlist = false,
  onPick,
  onPass,
  onToggleWishlist,
  onOpenMyLibrary,
}: CirculateBookCardProps) {
  const reduceMotion = useReducedMotion()

  const requestChip = model.requestCount > 0 ? `${model.requestCount} requests` : 'Be first'
  const nearChip = model.nearTag ? model.nearTag : model.distanceKm != null ? `${model.distanceKm.toFixed(1)} km` : null

  const actionsEnabled = model.actionsEnabled ?? true
  const pickDisabled = !actionsEnabled || model.pickActiveStatus != null || loadingPick
  const passDisabled = !actionsEnabled || model.passActive || loadingPass

  const pickLabel = !actionsEnabled
    ? 'Pick (unavailable)'
    : model.pickActiveStatus
    ? model.pickActiveStatus === 'accepted'
      ? 'Accepted'
      : 'Requested'
    : loadingPick
      ? 'Picking…'
      : 'Pick'

  const passLabel = !actionsEnabled
    ? 'Pass (unavailable)'
    : passDisabled
    ? model.passActive
      ? 'In circulation'
      : 'Giving…'
    : model.ownedInventoryBookId
      ? 'Pass'
      : 'Add to give'

  const tap = reduceMotion ? {} : { whileTap: { scale: 0.98 } }

  const providerLabel = useMemo(() => {
    const name = model.providerName?.trim() ? model.providerName.trim() : 'Reader'
    const trust = model.providerTrustScore != null ? ` • Trust ${Math.round(model.providerTrustScore)}` : ''
    return `${name}${trust}`
  }, [model.providerName, model.providerTrustScore])

  const ratingFromTrust = useMemo(() => {
    const trust = model.providerTrustScore
    if (trust == null) return null
    const v = Math.min(5, Math.max(0, trust / 20))
    return v
  }, [model.providerTrustScore])

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={styles.cardOuter}
      aria-label={`Book card: ${model.title}`}
    >
      <div className={styles.cardInner}>
        <div className={styles.topBar}>
          <div className={styles.topTitle} title={model.title}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M12 20l9-5-9-5-9 5 9 5z" />
              <path d="M12 12l9-5-9-5-9 5 9 5z" opacity="0.35" />
            </svg>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {model.title}
            </span>
          </div>

          <div className={styles.iconGroup}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={model.wishlistActive ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={() => void onToggleWishlist()}
              disabled={loadingWishlist}
              style={{ color: model.wishlistActive ? '#ff6b6b' : undefined }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={model.wishlistActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
              </svg>
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Open my bookshelf"
              onClick={onOpenMyLibrary}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.contentPad}>
          <div className={styles.mainRow}>
            <div className={styles.coverWrap}>
              {model.coverUrl ? (
                <img src={model.coverUrl} alt="" className={styles.coverImg} referrerPolicy="no-referrer" />
              ) : (
                <div className={styles.coverFallback}>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{model.title}</div>
                  <div style={{ fontWeight: 800, opacity: 0.7, fontSize: '0.85rem' }}>by {model.author}</div>
                </div>
              )}
            </div>

            <div className={styles.detailsPanel}>
              <div className={styles.genrePill} title={model.genre ?? ''}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path d="M8 7h8" />
                  <path d="M8 11h6" />
                  <path d="M8 15h5" />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {model.genre ?? 'Book'}
                </span>
              </div>

              <div className={styles.detailList}>
                <div className={styles.detailRow}>
                  <div className={styles.detailIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M21 16V8" />
                      <path d="M3 16V8" />
                      <path d="M7 7h10" />
                      <path d="M7 17h10" />
                    </svg>
                  </div>
                  <div className={styles.detailText}>
                    Author: <span>{model.author}</span>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className={styles.detailText}>
                    Condition: <span>{conditionLabel(model.condition)}</span>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className={styles.detailText}>
                    Rating:{' '}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {ratingFromTrust == null ? (
                        <span style={{ opacity: 0.7 }}>—</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          {Array.from({ length: 5 }).map((_, i) => {
                            const full = Math.floor(ratingFromTrust)
                            const rem = ratingFromTrust - full
                            const filled = i < full
                            const partial = i === full && rem > 0
                            const opacity = filled ? 1 : partial ? rem : 0.28
                            return (
                              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#e8943a" style={{ opacity }} aria-hidden>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            )
                          })}
                          <span style={{ color: '#7b4a0f' }}>{ratingFromTrust.toFixed(1)}</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sectionTitleRow}>
            <div className={styles.sectionTitle}>About</div>
            <div className={styles.sectionDivider} aria-hidden />
          </div>

          <div className={styles.aboutCard}>
            <p className={styles.aboutText}>
              {model.description?.trim()
                ? model.description.trim().split('\n')[0]
                : 'Proven guide for smooth circulation and community sharing.'}
            </p>
            <p className={styles.aboutTextMuted}>
              {nearChip ? `Near you • ${requestChip}` : requestChip}
            </p>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statRow}>
              <div className={styles.statIcon} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 20V10" />
                  <path d="M10 20V4" />
                  <path d="M16 20V14" />
                  <path d="M22 20V8" />
                </svg>
              </div>
              <div className={styles.statText}>Over {model.circulationCount} circulations</div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statIcon} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </div>
              <div className={styles.statText}>{providerLabel}</div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statIcon} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div className={styles.statText}>
                Tags: {[requestChip, nearChip, ...model.tags].filter(Boolean).slice(0, 3).join(', ') || '—'}
              </div>
            </div>
          </div>

          <div className={styles.bottomButtons}>
            <motion.button
              type="button"
              {...tap}
              onClick={() => void onPick()}
              disabled={pickDisabled}
              className={`${styles.ctaBtn} ${styles.ctaBtnPick}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M12 20l9-5-9-5-9 5 9 5z" />
                <path d="M12 12l9-5-9-5-9 5 9 5z" opacity="0.35" />
              </svg>
              {pickLabel}
            </motion.button>

            <motion.button
              type="button"
              {...tap}
              onClick={() => void onPass()}
              disabled={passDisabled}
              className={`${styles.ctaBtn} ${styles.ctaBtnPass}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {passLabel}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
