'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import styles from './TrustScoreBadge.module.css'
import { trustScoreApi, type TrustScoreResponse } from '../../../utils/api'
import { formatTrustMetrics } from '../../../utils/trustScoreFormat'

export interface TrustScoreBadgeProps {
  trustScore?: number
  /** When set, drives score + optional details without fetching. */
  trust?: TrustScoreResponse | null
  userId?: string
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  /** Success / activity / response lines under the badge (requires userId or trust). */
  showDetails?: boolean
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  trustScore,
  trust: trustProp,
  userId,
  size = 'medium',
  showLabel = true,
  showDetails = false,
}) => {
  const [resolved, setResolved] = useState<TrustScoreResponse | null>(null)

  useEffect(() => {
    if (trustProp) {
      setResolved(trustProp)
      return
    }
    let cancelled = false

    const load = async () => {
      if (userId) {
        try {
          const data = await trustScoreApi.getTrustScore(userId)
          if (!cancelled) setResolved(data)
        } catch {
          if (!cancelled) setResolved(null)
        }
        return
      }
      if (typeof trustScore === 'number') {
        setResolved({
          userId: '',
          trustScore,
          conditionAccuracyScore: 0,
          conditionAssessmentsCount: 0,
          accurateConditionCount: 0,
          showupReliabilityScore: 0,
          pickupCommitmentsCount: 0,
          successfulShowupsCount: 0,
          noShowsCount: 0,
          responseTimeScore: 0,
          averageResponseTimeHours: 0,
          requestsRespondedCount: 0,
          completionRate: 0,
          totalTransactions: 0,
          completedTransactions: 0,
          cancellationRate: 0,
          cancelledTransactions: 0,
          lastCalculatedAt: new Date().toISOString(),
          booksSharedCount: 0,
          avgResponseHours: null,
          responseSamples: 0,
          returnRatePercent: 0,
        })
        return
      }
      setResolved(null)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [trustProp, trustScore, userId])

  useEffect(() => {
    if (!userId || !showDetails) return
    const channel = supabase
      .channel(`user_trust_scores:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_trust_scores',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void trustScoreApi.getTrustScore(userId).then(setResolved).catch(() => null)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, showDetails])

  const score = resolved?.trustScore
  if (score == null || !Number.isFinite(score)) {
    return null
  }

  const getScoreColor = (s: number): string => {
    if (s >= 80) return '#10b981'
    if (s >= 60) return '#f59e0b'
    if (s >= 40) return '#f97316'
    return '#ef4444'
  }

  const getScoreLabel = (s: number): string => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Fair'
    return 'Poor'
  }

  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)
  const roundedScore = Math.round(score)

  const lines =
    showDetails && resolved && (resolved.userId || userId)
      ? formatTrustMetrics({ ...resolved, userId: resolved.userId || userId || '' })
      : null

  const rootClass = [
    styles.trustScoreBadge,
    styles[size],
    lines ? styles.withDetails : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <div className={styles.topRow}>
        <div
          className={styles.scoreCircle}
          style={{
            background: `conic-gradient(${scoreColor} ${roundedScore * 3.6}deg, #e5e7eb ${roundedScore * 3.6}deg)`,
          }}
        >
          <div className={styles.scoreInner}>
            <span className={styles.scoreValue}>{roundedScore}</span>
          </div>
        </div>
        {showLabel && (
          <div className={styles.scoreInfo}>
            <span className={styles.scoreLabel} style={{ color: scoreColor }}>
              {scoreLabel}
            </span>
            <span className={styles.scoreText}>Trust Score</span>
          </div>
        )}
      </div>
      {lines && (
        <ul className={styles.detailList} aria-label="Trust metrics">
          <li>{lines.successRate}</li>
          <li>{lines.activity}</li>
          <li>{lines.responseTime}</li>
        </ul>
      )}
    </div>
  )
}

export default TrustScoreBadge
