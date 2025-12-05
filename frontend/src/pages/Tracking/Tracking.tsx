import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ordersApi, OrderTrackingResponse, TrackingStep } from '../../utils/api'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Tracking.module.css'

const Tracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const { error: showError } = useToast()
  const [trackingNumber, setTrackingNumber] = useState(orderId || '')
  const [trackingData, setTrackingData] = useState<OrderTrackingResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (orderId && user?.id) {
      loadTracking(orderId)
    }
  }, [orderId, user?.id])

  const loadTracking = async (id: string) => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const data = await ordersApi.getTracking(id, user.id)
      setTrackingData(data)
      setTrackingNumber(data.trackingNumber)
    } catch (err) {
      showError('Failed to load tracking information')
      console.error('Error loading tracking:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber || !user?.id) return
    
    try {
      setLoading(true)
      // Try to find order by tracking number
      const orders = await ordersApi.getMyOrders(user.id)
      const order = orders.find(o => o.trackingNumber === trackingNumber || o.id === trackingNumber)
      
      if (order) {
        await loadTracking(order.id)
      } else {
        showError('Order not found')
      }
    } catch (err) {
      showError('Failed to track order')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !trackingData) {
    return (
      <div className={styles.tracking}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading tracking information...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tracking}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/orders" className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <h1 className={styles.title}>Track Your Order</h1>
        </div>

        {/* Search Form */}
        {!trackingData && (
          <div className={styles.searchCard}>
            <h2 className={styles.searchTitle}>Enter Tracking Number</h2>
            <form onSubmit={handleTrack} className={styles.searchForm}>
              <Input
                placeholder="Enter your order tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                fullWidth
                required
              />
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? 'Tracking...' : 'Track Order'}
              </Button>
            </form>
          </div>
        )}

        {/* Tracking Timeline */}
        {trackingData && (
          <div className={styles.timelineCard}>
            <div className={styles.orderInfo}>
              <h2 className={styles.orderTitle}>Order #{trackingData.trackingNumber}</h2>
              <p className={styles.orderSubtitle}>
                Status: {trackingData.status.replace('_', ' ')}
              </p>
              {trackingData.estimatedDelivery && (
                <p className={styles.orderSubtitle}>
                  Estimated delivery: {new Date(trackingData.estimatedDelivery).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className={styles.timeline}>
              {trackingData.steps.map((step, index) => (
                <div key={step.id} className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>
                    <div
                      className={`${styles.marker} ${step.completed ? styles.completed : styles.pending}`}
                    >
                      {step.completed && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {index < trackingData.steps.length - 1 && (
                      <div className={`${styles.timelineLine} ${step.completed ? styles.completed : ''}`} />
                    )}
                  </div>
                  <div className={styles.timelineContent}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDescription}>{step.description}</p>
                    {step.date && (
                      <p className={styles.stepDate}>
                        {new Date(step.date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTrackingData(null)
                setTrackingNumber('')
              }}
              className={styles.trackAnotherButton}
            >
              Track Another Order
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tracking
