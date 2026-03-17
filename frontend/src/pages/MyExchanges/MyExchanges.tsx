import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { exchangesApi, ExchangeResponse } from '../../utils/api'
import Button from '../../components/shared/Button/Button'
import styles from './MyExchanges.module.css'

const MyExchanges: React.FC = () => {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const { user } = useAuth()
  const [exchanges, setExchanges] = useState<ExchangeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('all')

  useEffect(() => {
    if (user?.id) {
      loadExchanges()
    }
  }, [user?.id])

  const loadExchanges = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const data = await exchangesApi.getMyExchanges(user.id)
      setExchanges(data)
    } catch (err) {
      showError('Failed to load exchanges')
      console.error('Error loading exchanges:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (exchangeId: string) => {
    if (!confirm('Are you sure you want to cancel this exchange?')) {
      return
    }

    if (!user?.id) return
    try {
      await exchangesApi.cancel(exchangeId, user.id)
      success('Exchange cancelled successfully')
      loadExchanges()
    } catch (err: any) {
      showError(err.message || 'Failed to cancel exchange')
    }
  }

  const handleViewDetails = (exchangeId: string) => {
    navigate(`/exchanges/${exchangeId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800'
      case 'CONFIRMED':
        return '#2196F3'
      case 'COMPLETED':
        return '#4CAF50'
      case 'CANCELLED':
        return '#F44336'
      default:
        return '#757575'
    }
  }

  const filteredExchanges = filter === 'all' 
    ? exchanges 
    : exchanges.filter(ex => ex.status === filter)

  const isSeller = (exchange: ExchangeResponse) => {
    return user?.id === exchange.sellerId
  }

  return (
    <div className={styles.myExchanges}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Exchanges</h1>
        <p className={styles.subtitle}>
          Manage your book exchange requests and track their status.
        </p>
      </div>

      <div className={styles.actions}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'PENDING' ? styles.active : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'CONFIRMED' ? styles.active : ''}`}
            onClick={() => setFilter('CONFIRMED')}
          >
            Confirmed
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'COMPLETED' ? styles.active : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'CANCELLED' ? styles.active : ''}`}
            onClick={() => setFilter('CANCELLED')}
          >
            Cancelled
          </button>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/exchange')}
          className={styles.browseButton}
        >
          Browse Books for Exchange
        </Button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading exchanges...</div>
      ) : filteredExchanges.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No exchanges found.</p>
          <Button variant="primary" onClick={() => navigate('/exchange')}>
            Start an Exchange
          </Button>
        </div>
      ) : (
        <div className={styles.exchangesList}>
          {filteredExchanges.map((exchange) => (
            <div key={exchange.id} className={styles.exchangeCard}>
              <div className={styles.exchangeHeader}>
                <div className={styles.exchangeInfo}>
                  <h3 className={styles.bookTitle}>{exchange.bookTitle}</h3>
                  <p className={styles.bookAuthor}>by {exchange.bookAuthor}</p>
                </div>
                <div
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(exchange.status) }}
                >
                  {exchange.status}
                </div>
              </div>

              <div className={styles.exchangeDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Role:</span>
                  <span className={styles.value}>
                    {isSeller(exchange) ? 'Seller' : 'Buyer'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>
                    {isSeller(exchange) ? 'Buyer:' : 'Seller:'}
                  </span>
                  <span className={styles.value}>
                    {isSeller(exchange) ? exchange.buyerName : exchange.sellerName}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Credit Amount:</span>
                  <span className={styles.value}>₹{exchange.creditAmount.toFixed(2)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Service Fee:</span>
                  <span className={styles.value}>₹{exchange.serviceFee.toFixed(2)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Created:</span>
                  <span className={styles.value}>
                    {new Date(exchange.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.exchangeActions}>
                <Button
                  variant="secondary"
                  onClick={() => handleViewDetails(exchange.id)}
                  className={styles.viewButton}
                >
                  View Details
                </Button>
                {exchange.status === 'PENDING' && (
                  <Button
                    variant="danger"
                    onClick={() => handleCancel(exchange.id)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyExchanges

