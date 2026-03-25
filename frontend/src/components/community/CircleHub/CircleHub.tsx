'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { communityApi, CommunityCircleResponse } from '../../../utils/api'
import { useToast } from '../../../contexts/ToastContext'
import styles from './CircleHub.module.css'

const CircleHub: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const [circles, setCircles] = useState<CommunityCircleResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCircles = async () => {
      try {
        setLoading(true)
        const data = await communityApi.getCircles()
        setCircles(data)
      } catch (error: any) {
        console.error('Error loading circles:', error)
        showError('Failed to load community circles. Please try again later.')
        setCircles([])
      } finally {
        setLoading(false)
      }
    }
    loadCircles()
  }, [showError])

  const handleCircleClick = (circleId: string) => {
    navigate(`/circles/${circleId}`)
  }

  if (loading) {
    return (
      <section className={styles.circleSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Community</span>
          <h2 className={styles.sectionTitle}>Reading Circles</h2>
          <p className={styles.sectionSubtitle}>
            Join dedicated reading circles that keep the exchange alive.
          </p>
        </div>
        <div className={styles.emptyState}>Loading circles...</div>
      </section>
    )
  }

  return (
    <section className={styles.circleSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>Community</span>
        <h2 className={styles.sectionTitle}>Reading Circles</h2>
        <p className={styles.sectionSubtitle}>
          Join dedicated reading circles that keep the exchange alive.
        </p>
      </div>

      {circles.length === 0 ? (
        <div className={styles.emptyState}>
          No reading circles available at the moment. Check back soon!
        </div>
      ) : (
        <div className={styles.circlesGrid}>
          {circles.map((circle) => (
            <div
              key={circle.id}
              className={styles.circleCard}
              onClick={() => handleCircleClick(circle.id)}
            >
              <div className={styles.circleHeader}>
                <div className={styles.circleBadge}>{circle.badge}</div>
                <div>
                  <h3 className={styles.circleName}>{circle.name}</h3>
                  <p className={styles.circleHost}>Hosted by {circle.host}</p>
                </div>
              </div>

              <p className={styles.circleDescription}>{circle.description}</p>

              <div className={styles.metricsRow}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Members</span>
                  <div className={styles.metricValue}>{circle.members}</div>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Books</span>
                  <div className={styles.metricValue}>-</div>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Activity</span>
                  <div className={styles.metricValue}>-</div>
                </div>
              </div>

              {circle.tags && circle.tags.length > 0 && (
                <div className={styles.tagsRow}>
                  {circle.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.circleFooter}>
                <span className={styles.streakPill}>
                  🔥 Active for {circle.streakDays} days
                </span>
                <button
                  className={styles.ghostButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCircleClick(circle.id)
                  }}
                >
                  Explore
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default CircleHub
