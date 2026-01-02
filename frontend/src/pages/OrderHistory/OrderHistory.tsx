import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ordersApi, OrderResponse } from '../../utils/api'
import Button from '../../components/shared/Button/Button'
import styles from './OrderHistory.module.css'

const OrderHistory: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { error: showError } = useToast()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadOrders()
    }
  }, [user?.id])

  const loadOrders = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const data = await ordersApi.getMyOrders(user.id)
      setOrders(data)
    } catch (err) {
      showError('Failed to load order history')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status: string) => {
    const statusLower = status.toLowerCase().replace('_', '')
    return styles[statusLower] || ''
  }

  if (loading) {
    return (
      <div className={styles.orderHistory}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading order history...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.orderHistory}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Order History</h1>
        <p className={styles.pageDescription}>
          View and track all your past orders
        </p>

        <div className={styles.ordersList}>
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <h3 className={styles.orderId}>Order #{order.trackingNumber || order.id.substring(0, 8)}</h3>
                    <p className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className={styles.orderDetails}>
                  <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                  <span className={styles.orderTotal}>₹{order.totalAmount.toFixed(2)}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/tracking/${order.id}`)}
                >
                  Track Order
                </Button>
              </div>
            )
          })}
        </div>

        {orders.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.emptyIcon}>
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h2 className={styles.emptyTitle}>No orders yet</h2>
            <p className={styles.emptyDescription}>
              Your order history will appear here once you place your first order.
            </p>
            <Button variant="primary" onClick={() => navigate('/books')}>
              Browse Books
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistory
