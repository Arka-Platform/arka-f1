import React from 'react'
import styles from './TrustScoreBadge.module.css'

export interface TrustScoreBadgeProps {
  trustScore: number
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  trustScore,
  size = 'medium',
  showLabel = true,
}) => {
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

  const scoreColor = getScoreColor(trustScore)
  const scoreLabel = getScoreLabel(trustScore)
  const roundedScore = Math.round(trustScore)

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


