import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { demandApi, recommendationsApi, BookRequestResponse, BookResponse } from '../../../utils/api'
import styles from './ActivityFeed.module.css'

interface ActivityItem {
  id: string
  type: 'request_created' | 'request_fulfilled' | 'request_completed' | 'most_requested' | 'recommended'
  message: string
  timestamp: string
  request?: BookRequestResponse
  book?: BookResponse
  requestCount?: number
}

const ActivityFeed: React.FC = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
    const interval = setInterval(loadActivities, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [user?.id])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const activityItems: ActivityItem[] = []

      // Get recently served requests and open requests
      const [servedRequests, openRequests, mostRequestedBooks] = await Promise.all([
        demandApi.getRecentlyServedRequests(5).catch(() => []),
        demandApi.getOpenRequests().catch(() => []),
        demandApi.getMostRequestedBooks(3).catch(() => [])
      ])

      // Add recently served/completed requests
      servedRequests.slice(0, 2).forEach((request) => {
        activityItems.push({
          id: `served-${request.id}`,
          type: request.status === 'COMPLETED' ? 'request_completed' : 'request_fulfilled',
          message: `${request.requesterName} just got "${request.title}" by ${request.author}! ${request.fulfilledByName ? `Fulfilled by ${request.fulfilledByName}` : ''}`,
          timestamp: request.fulfilledAt || request.createdAt,
          request
        })
      })

      // Add recently created requests
      openRequests.slice(0, 2).forEach((request) => {
        activityItems.push({
          id: `created-${request.id}`,
          type: 'request_created',
          message: `${request.requesterName} is looking for "${request.title}" by ${request.author}${request.location ? ` in ${request.location}` : ''}`,
          timestamp: request.createdAt,
          request
        })
      })

      // Add most requested book
      if (mostRequestedBooks.length > 0) {
        const mostRequested = mostRequestedBooks[0]
        activityItems.push({
          id: 'most-requested',
          type: 'most_requested',
          message: `🔥 "${mostRequested.title}" by ${mostRequested.author} is the most requested book (${mostRequested.requestCount} requests)!`,
          timestamp: new Date().toISOString(), // Use current time for sorting
          requestCount: mostRequested.requestCount
        })
      }

      // Add personalized recommendations if user is logged in
      if (user?.id) {
        try {
          const recommendations = await recommendationsApi.getRecommendations(user.id, 2)
          recommendations.slice(0, 1).forEach((book) => {
            activityItems.push({
              id: `recommended-${book.id}`,
              type: 'recommended',
              message: `✨ Based on your interests, you might like "${book.title}" by ${book.author}`,
              timestamp: new Date().toISOString(),
              book
            })
          })
        } catch (error) {
          console.error('Failed to load recommendations:', error)
        }
      }

      // Sort by timestamp (most recent first)
      activityItems.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setActivities(activityItems.slice(0, 6)) // Show top 6
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request_created':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        )
      case 'request_fulfilled':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )
      case 'request_completed':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        )
      case 'most_requested':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
      case 'recommended':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'request_created':
        return '#3b82f6' // Blue
      case 'request_fulfilled':
        return '#10b981' // Green
      case 'request_completed':
        return '#8b5cf6' // Purple
      case 'most_requested':
        return '#f59e0b' // Amber/Orange
      case 'recommended':
        return '#ec4899' // Pink
      default:
        return '#6b7280'
    }
  }

  if (loading) {
    return (
      <section className={styles.activityFeed}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading activity...</div>
        </div>
      </section>
    )
  }

  if (activities.length === 0) {
    return null
  }

  return (
    <section className={styles.activityFeed}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconWrapper}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>What's Happening</h2>
              <p className={styles.subtitle}>Live activity on Arka - Join the community!</p>
            </div>
          </div>
        </div>

        <div className={styles.feedContainer}>
          <div className={styles.feedContent}>
            {activities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div 
                  className={styles.activityIcon}
                  style={{ backgroundColor: getActivityColor(activity.type) + '20', color: getActivityColor(activity.type) }}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityMessage}>{activity.message}</p>
                  <span className={styles.activityTime}>
                    {getTimeAgo(new Date(activity.timestamp))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ActivityFeed

