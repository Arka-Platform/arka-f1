import React, { useState, useEffect } from 'react'
import styles from './CircleHub.module.css'
import Button from '../../shared/Button/Button'
import { communityApi, CommunityCircleResponse } from '../../../utils/api'

const CircleHub: React.FC = () => {
  const [circles, setCircles] = useState<CommunityCircleResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCircles = async () => {
      try {
        setLoading(true)
        const data = await communityApi.getCircles()
        setCircles(data)
      } catch (error) {
        console.error('Error loading circles:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCircles()
  }, [])

  if (loading) {
    return (
      <section className={styles.circleSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Community Exchange</span>
          <h2 className={styles.sectionTitle}>Circles as Hubs</h2>
          <p className={styles.sectionSubtitle}>Loading circles...</p>
        </div>
      </section>
    )
  }
  return (
    <section className={styles.circleSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>Community Exchange</span>
        <h2 className={styles.sectionTitle}>Circles as Hubs</h2>
        <p className={styles.sectionSubtitle}>
          Join dedicated reading circles that keep the exchange chain alive. Each hub curates genres,
          nurtures streaks, and gives you transparent insight into what&apos;s moving next.
        </p>
      </div>

      <div className={styles.circlesGrid}>
        {circles.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No circles available at the moment.</p>
          </div>
        ) : (
          circles.map((circle) => (
          <article key={circle.id} className={styles.circleCard}>
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
                <span className={styles.metricLabel}>Active Chains</span>
                <div className={styles.metricValue}>{circle.activeChains}</div>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Streak</span>
                <div className={styles.metricValue}>{circle.streakDays}d</div>
              </div>
            </div>

            <div className={styles.tagsRow}>
              {circle.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>

            <div className={styles.circleFooter}>
              <span className={styles.streakPill}>
                🔥 Chain alive for {circle.streakDays} days
              </span>
              <Button variant="secondary" onClick={() => {}}>
                View Circle
              </Button>
            </div>

            <button className={styles.ghostButton} type="button" onClick={() => {}}>
              See live shelf
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </article>
          ))
        )}
      </div>
    </section>
  )
}

export default CircleHub












