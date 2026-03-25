'use client'

import React, { useState, useEffect } from 'react'
import { demandApi, WeeklyStats as WeeklyStatsType } from '../../../utils/api'
import styles from './WeeklyStats.module.css'

const WeeklyStats: React.FC = () => {
  const [stats, setStats] = useState<WeeklyStatsType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await demandApi.getWeeklyStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load weekly stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading stats...</div>
        </div>
      </section>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <section className={styles.stats}>
      <div className={styles.container}>
        <h2 className={styles.title}>This Week's Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.openRequests}</div>
              <div className={styles.statLabel}>Open Requests</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.completedThisWeek}</div>
              <div className={styles.statLabel}>Completed This Week</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.createdThisWeek}</div>
              <div className={styles.statLabel}>Created This Week</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WeeklyStats


