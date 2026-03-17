import React, { useEffect, useState } from 'react'
import styles from './TrustScoreBadge.module.css'
import { trustScoreApi } from '../../../utils/api'

export interface TrustScoreBadgeProps {
  trustScore?: number
  userId?: string
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  trustScore,
  userId,
  size = 'medium',
  showLabel = true,
}) => {
  const [resolvedScore, setResolvedScore] = useState<number | null>(
    typeof trustScore === 'number' ? trustScore : null
  )

  useEffect(() => {
    let cancelled = false

    const resolve = async () => {
      if (typeof trustScore === 'number') {
        setResolvedScore(trustScore)
        return
      }
      if (!userId) {
        setResolvedScore(null)
        return
      }
      try {
        const data = await trustScoreApi.getTrustScore(userId)
        if (!cancelled) setResolvedScore(data.trustScore)
      } catch {
        if (!cancelled) setResolvedScore(null)
      }
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [trustScore, userId])

  if (resolvedScore == null) {
    return null
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981' // Green
    if (score >= 60) return '#f59e0b' // Amber
    if (score >= 40) return '#f97316' // Orange
    return '#ef4444' // Red
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  const scoreColor = getScoreColor(resolvedScore)
  const scoreLabel = getScoreLabel(resolvedScore)
  const roundedScore = Math.round(resolvedScore)

  return (
    <div className={`${styles.trustScoreBadge} ${styles[size]}`}>
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
  )
}

export default TrustScoreBadge


