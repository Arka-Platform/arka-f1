'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { communityApi, CommunityCircleResponse } from '../../../utils/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import Button from '../../shared/Button/Button'
import CreateCircleModal, { type CreateCircleFormPayload } from '../CreateCircleModal/CreateCircleModal'
import styles from './CircleHub.module.css'

const CircleHub: React.FC = () => {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { error: showError, success } = useToast()
  const [circles, setCircles] = useState<CommunityCircleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadCircles = useCallback(async () => {
    try {
      setLoading(true)
      const data = await communityApi.getCircles()
      setCircles(data)
    } catch (error: unknown) {
      console.error('Error loading circles:', error)
      showError('Failed to load community circles. Please try again later.')
      setCircles([])
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadCircles()
  }, [loadCircles])

  const openCreate = () => {
    if (!isAuthenticated || !user?.id) {
      showError('Sign in to create a reading circle.')
      router.push('/login')
      return
    }
    setFormError(null)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    if (submitting) return
    setCreateOpen(false)
    setFormError(null)
  }

  const handleCreateSubmit = async (payload: CreateCircleFormPayload) => {
    if (!user?.id) return
    setFormError(null)
    setSubmitting(true)
    try {
      const created = await communityApi.createCircle(user.id, {
        name: payload.name,
        description: payload.description || undefined,
        hostDisplayName: payload.hostDisplayName || undefined,
      })
      success('Reading circle created.')
      setCreateOpen(false)
      await loadCircles()
      router.push(`/circles/${created.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create circle.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCircleClick = (circleId: string) => {
    router.push(`/circles/${circleId}`)
  }

  const headerBlock = (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionHeaderText}>
        <span className={styles.sectionEyebrow}>Community</span>
        <h2 className={styles.sectionTitle}>Reading Circles</h2>
        <p className={styles.sectionSubtitle}>
          Start a circle or join one—keep books moving together.
        </p>
      </div>
      <div className={styles.sectionHeaderActions}>
        <Button type="button" variant="primary" onClick={openCreate}>
          Create a circle
        </Button>
      </div>
    </div>
  )

  return (
    <section className={styles.circleSection}>
      {headerBlock}

      {loading ? (
        <div className={styles.emptyState}>Loading circles...</div>
      ) : circles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No reading circles yet.</p>
          <p className={styles.emptyHint}>
            {isAuthenticated ? (
              <>
                Be the first to{' '}
                <button type="button" className={styles.inlineLink} onClick={openCreate}>
                  create one
                </button>
                .
              </>
            ) : (
              <>
                <Link href="/login" className={styles.inlineLink}>
                  Sign in
                </Link>{' '}
                to create a circle.
              </>
            )}
          </p>
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
                <span className={styles.streakPill}>🔥 Active for {circle.streakDays} days</span>
                <button
                  type="button"
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

      <CreateCircleModal
        open={createOpen}
        submitting={submitting}
        formError={formError}
        onClose={closeCreate}
        onSubmit={handleCreateSubmit}
      />
    </section>
  )
}

export default CircleHub
