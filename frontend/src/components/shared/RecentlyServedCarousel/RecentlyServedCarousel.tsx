import React, { useState, useEffect, useRef } from 'react'
import { demandApi, BookRequestResponse } from '../../../utils/api'
import styles from './RecentlyServedCarousel.module.css'

interface RecentlyServedCarouselProps {
  limit?: number
}

const RecentlyServedCarousel: React.FC<RecentlyServedCarouselProps> = ({ limit = 10 }) => {
  const [requests, setRequests] = useState<BookRequestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    loadRecentlyServedRequests()
  }, [limit])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateScrollButtons = () => {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }

    updateScrollButtons()
    container.addEventListener('scroll', updateScrollButtons)
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [requests])

  const loadRecentlyServedRequests = async () => {
    try {
      setLoading(true)
      const data = await demandApi.getRecentlyServedRequests(limit)
      setRequests(data)
    } catch (error) {
      console.error('Failed to load recently served requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 400
    const targetScroll = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })
  }

  if (loading) {
    return (
      <section className={styles.carousel}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Recently Served Requests</h2>
          <div className={styles.loading}>Loading recently served requests...</div>
        </div>
      </section>
    )
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <section className={styles.carousel}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>Recently Served Requests</h2>
          <p className={styles.sectionSubtitle}>
            See what books have been successfully matched and delivered
          </p>
        </div>

        <div className={styles.carouselWrapper}>
          {canScrollLeft && (
            <button
              className={styles.scrollButton}
              onClick={() => scroll('left')}
              aria-label="Scroll left"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          <div className={styles.carouselContainer} ref={scrollContainerRef}>
            <div className={styles.carouselContent}>
              {requests.map((request) => (
                <div key={request.id} className={styles.requestCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.statusBadge}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>{request.status}</span>
                    </div>
                  </div>
                  
                  <div className={styles.cardBody}>
                    <h3 className={styles.bookTitle}>{request.title}</h3>
                    <p className={styles.bookAuthor}>by {request.author}</p>
                    
                    {request.genre && (
                      <div className={styles.genreTag}>{request.genre}</div>
                    )}
                    
                    <div className={styles.cardDetails}>
                      {request.fulfilledByName && (
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>Fulfilled by:</span>
                          <span className={styles.detailValue}>{request.fulfilledByName}</span>
                        </div>
                      )}
                      {request.fulfilledAt && (
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>Completed:</span>
                          <span className={styles.detailValue}>
                            {new Date(request.fulfilledAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canScrollRight && (
            <button
              className={styles.scrollButton}
              onClick={() => scroll('right')}
              aria-label="Scroll right"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default RecentlyServedCarousel

