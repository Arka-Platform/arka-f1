import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { exchangesApi, ExchangeResponse, trustScoreApi } from '../../utils/api'
import Button from '../../components/shared/Button/Button'
import TrustScoreBadge from '../../components/shared/TrustScoreBadge/TrustScoreBadge'
import styles from './ExchangeDetail.module.css'

const ExchangeDetail: React.FC = () => {
  const params = useParams<{ exchangeId?: string }>()
  const exchangeId = params?.exchangeId
  const router = useRouter()
  const { success, error: showError } = useToast()
  const { user } = useAuth()
  const [exchange, setExchange] = useState<ExchangeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [otherPartyTrustScore, setOtherPartyTrustScore] = useState<number | null>(null)

  useEffect(() => {
    if (exchangeId) {
      loadExchange()
    }
  }, [exchangeId])

  // Load trust score when exchange is loaded
  useEffect(() => {
    if (exchange && user?.id) {
      const otherPartyId = user.id === exchange.sellerId ? exchange.buyerId : exchange.sellerId
      if (otherPartyId) {
        trustScoreApi.getTrustScore(otherPartyId)
          .then(scoreData => setOtherPartyTrustScore(scoreData.trustScore))
          .catch((error: any) => {
            // Only log if it's not a "user not found" error (which is expected for new users)
            if (error.message && !error.message.includes('User not found')) {
              console.error('Error loading trust score:', error)
            }
            // Set to null to indicate trust score is not available
            setOtherPartyTrustScore(null)
          })
      }
    }
  }, [exchange, user?.id])

  const loadExchange = async () => {
    if (!exchangeId || !user?.id) return

    try {
      setLoading(true)
      const exchanges = await exchangesApi.getMyExchanges(user.id)
      const found = exchanges.find(ex => ex.id === exchangeId)
      if (found) {
        setExchange(found)
      } else {
        showError('Exchange not found')
        router.push('/exchanges/my')
      }
    } catch (err) {
      showError('Failed to load exchange details')
      console.error('Error loading exchange:', err)
      router.push('/exchanges/my')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!exchangeId || !user?.id) return

    if (!confirm('Are you sure you want to confirm this exchange? This will notify the buyer.')) {
      return
    }

    if (!user?.id) return
    try {
      setProcessing(true)
      await exchangesApi.confirm(exchangeId, user.id)
      success('Exchange confirmed successfully!')
      loadExchange()
    } catch (err: any) {
      showError(err.message || 'Failed to confirm exchange')
    } finally {
      setProcessing(false)
    }
  }

  const handleComplete = async () => {
    if (!exchangeId || !user?.id) return

    if (!confirm('Have you received the book? This will complete the exchange.')) {
      return
    }

    if (!user?.id) return
    try {
      setProcessing(true)
      await exchangesApi.complete(exchangeId, user.id)
      success('Exchange completed successfully!')
      loadExchange()
    } catch (err: any) {
      showError(err.message || 'Failed to complete exchange')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!exchangeId) return

    if (!confirm('Are you sure you want to cancel this exchange?')) {
      return
    }

    if (!user?.id) return
    try {
      setProcessing(true)
      await exchangesApi.cancel(exchangeId, user.id)
      success('Exchange cancelled successfully')
      router.push('/exchanges/my')
    } catch (err: any) {
      showError(err.message || 'Failed to cancel exchange')
      setProcessing(false)
    }
  }

  const isSeller = () => {
    return user?.id === exchange?.sellerId
  }

  const isBuyer = () => {
    return user?.id === exchange?.buyerId
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800'
      case 'COMPLETED':
        return '#4CAF50'
      case 'FAILED':
        return '#9E9E9E'
      case 'CANCELLED':
        return '#F44336'
      default:
        return '#757575'
    }
  }

  const isCompletedFlow = exchange?.status === 'COMPLETED'
  const isCancelled = exchange?.status === 'CANCELLED'
  const isFailed = exchange?.status === 'FAILED'
  const isPending = exchange?.status === 'PENDING'

  if (loading) {
    return (
      <div className={styles.exchangeDetail}>
        <div className={styles.loading}>Loading exchange details...</div>
      </div>
    )
  }

  if (!exchange) {
    return (
      <div className={styles.exchangeDetail}>
        <div className={styles.emptyState}>
          <p>Exchange not found.</p>
          <Button variant="primary" onClick={() => router.push('/exchanges/my')}>
            Back to My Exchanges
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.exchangeDetail}>
      <div className={styles.header}>
        <Button
          variant="secondary"
          onClick={() => router.push('/exchanges/my')}
          className={styles.backButton}
        >
          ← Back to My Exchanges
        </Button>
        <h1 className={styles.title}>Exchange Details</h1>
      </div>

      <div className={styles.exchangeCard}>
        <div className={styles.exchangeHeader}>
          <div>
            <h2 className={styles.bookTitle}>{exchange.bookTitle}</h2>
            <p className={styles.bookAuthor}>by {exchange.bookAuthor}</p>
          </div>
          <div
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(exchange.status) }}
          >
            {exchange.status}
          </div>
        </div>

        <div className={styles.exchangeInfo}>
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Exchange Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Your Role:</span>
                <span className={styles.infoValue}>
                  {isSeller() ? 'Seller' : 'Buyer'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  {isSeller() ? 'Buyer:' : 'Seller:'}
                </span>
                <div className={styles.infoValueWithTrustScore}>
                  <span>{isSeller() ? exchange.buyerName : exchange.sellerName}</span>
                  {otherPartyTrustScore !== null && (
                    <TrustScoreBadge trustScore={otherPartyTrustScore} size="small" showLabel={false} />
                  )}
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Amount:</span>
                <span className={styles.infoValue}>₹{exchange.amount.toFixed(2)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Service Fee:</span>
                <span className={styles.infoValue}>₹{exchange.serviceFee.toFixed(2)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Cost:</span>
                <span className={styles.infoValue}>
                  ₹{(exchange.amount + exchange.serviceFee).toFixed(2)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Created:</span>
                <span className={styles.infoValue}>
                  {new Date(exchange.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Updated:</span>
                <span className={styles.infoValue}>
                  {new Date(exchange.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.statusSection}>
            <h3 className={styles.sectionTitle}>Status Timeline</h3>
            <div className={styles.timeline}>
              <div className={`${styles.timelineItem} ${!isCancelled && !isFailed ? styles.completed : ''}`}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <h4>Exchange started</h4>
                  <p>{new Date(exchange.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className={`${styles.timelineItem} ${isPending ? '' : !isCancelled && !isFailed ? styles.completed : ''}`}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <h4>Processing</h4>
                  <p>
                    {isPending
                      ? 'Awaiting confirmation or completion steps (if applicable).'
                      : new Date(exchange.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className={`${styles.timelineItem} ${isCompletedFlow ? styles.completed : ''}`}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <h4>Completed</h4>
                  <p>
                    {isCompletedFlow
                      ? new Date(exchange.updatedAt).toLocaleString()
                      : isCancelled
                        ? 'Cancelled'
                        : isFailed
                          ? 'Failed'
                          : 'Not completed yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {isPending && isSeller() && (
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={processing}
              className={styles.actionButton}
            >
              {processing ? 'Processing...' : 'Mark complete'}
            </Button>
          )}
          {isPending && isBuyer() && (
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={processing}
              className={styles.actionButton}
            >
              {processing ? 'Processing...' : 'Mark complete'}
            </Button>
          )}
          {isPending && (
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={processing}
              className={styles.actionButton}
            >
              {processing ? 'Processing...' : 'Cancel exchange'}
            </Button>
          )}
          {isCompletedFlow && (
            <div className={styles.completedMessage}>
              <p>✅ This exchange is completed.</p>
            </div>
          )}
          {isCancelled && (
            <div className={styles.cancelledMessage}>
              <p>❌ This exchange has been cancelled.</p>
            </div>
          )}
          {isFailed && (
            <div className={styles.cancelledMessage}>
              <p>This exchange failed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExchangeDetail

