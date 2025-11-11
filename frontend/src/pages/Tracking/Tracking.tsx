import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Tracking.module.css'

interface TrackingStep {
  id: string
  title: string
  description: string
  date?: string
  completed: boolean
}

const Tracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [trackingNumber, setTrackingNumber] = useState(orderId || '')
  const [orderData, setOrderData] = useState<TrackingStep[] | null>(null)

  useEffect(() => {
    if (orderId) {
      // Simulate fetching order data
      const mockSteps: TrackingStep[] = [
        {
          id: '1',
          title: 'Order Placed',
          description: 'Your order has been received',
          date: '2024-01-15 10:30 AM',
          completed: true,
        },
        {
          id: '2',
          title: 'Processing',
          description: 'Your order is being prepared',
          date: '2024-01-15 11:00 AM',
          completed: true,
        },
        {
          id: '3',
          title: 'Picked Up',
          description: 'Your books have been collected',
          date: '2024-01-16 09:00 AM',
          completed: true,
        },
        {
          id: '4',
          title: 'In Transit',
          description: 'Your order is on the way',
          date: '2024-01-16 02:00 PM',
          completed: true,
        },
        {
          id: '5',
          title: 'Out for Delivery',
          description: 'Your order will arrive soon',
          completed: false,
        },
        {
          id: '6',
          title: 'Delivered',
          description: 'Your order has been delivered',
          completed: false,
        },
      ]
      setOrderData(mockSteps)
    }
  }, [orderId])

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber) {
      // Simulate fetching order data
      const mockSteps: TrackingStep[] = [
        {
          id: '1',
          title: 'Order Placed',
          description: 'Your order has been received',
          date: '2024-01-15 10:30 AM',
          completed: true,
        },
        {
          id: '2',
          title: 'Processing',
          description: 'Your order is being prepared',
          date: '2024-01-15 11:00 AM',
          completed: true,
        },
        {
          id: '3',
          title: 'Picked Up',
          description: 'Your books have been collected',
          date: '2024-01-16 09:00 AM',
          completed: true,
        },
        {
          id: '4',
          title: 'In Transit',
          description: 'Your order is on the way',
          date: '2024-01-16 02:00 PM',
          completed: true,
        },
        {
          id: '5',
          title: 'Out for Delivery',
          description: 'Your order will arrive soon',
          completed: false,
        },
        {
          id: '6',
          title: 'Delivered',
          description: 'Your order has been delivered',
          completed: false,
        },
      ]
      setOrderData(mockSteps)
    }
  }

  return (
    <div className={styles.tracking}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/account" className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Account
          </Link>
          <h1 className={styles.title}>Track Your Order</h1>
        </div>

        {/* Search Form */}
        {!orderData && (
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
              <Button type="submit" variant="primary" fullWidth>
                Track Order
              </Button>
            </form>
          </div>
        )}

        {/* Tracking Timeline */}
        {orderData && (
          <div className={styles.timelineCard}>
            <div className={styles.orderInfo}>
              <h2 className={styles.orderTitle}>Order #{trackingNumber || orderId}</h2>
              <p className={styles.orderSubtitle}>Estimated delivery: January 18, 2024</p>
            </div>

            <div className={styles.timeline}>
              {orderData.map((step, index) => (
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
                    {index < orderData.length - 1 && (
                      <div className={`${styles.timelineLine} ${step.completed ? styles.completed : ''}`} />
                    )}
                  </div>
                  <div className={styles.timelineContent}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDescription}>{step.description}</p>
                    {step.date && (
                      <p className={styles.stepDate}>{step.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.orderDetails}>
              <h3 className={styles.detailsTitle}>Order Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Order Number:</span>
                  <span className={styles.detailValue}>{trackingNumber || orderId}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Order Date:</span>
                  <span className={styles.detailValue}>January 15, 2024</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Items:</span>
                  <span className={styles.detailValue}>3 items</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Amount:</span>
                  <span className={styles.detailValue}>$9.99</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setOrderData(null)}
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


