import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/shared/Button/Button'
import styles from './OrderHistory.module.css'

const OrderHistory: React.FC = () => {
  const navigate = useNavigate()

  const recentOrders = [
    { id: 'ORD-001', date: '2024-01-15', items: 3, total: '$9.99', status: 'Completed' },
    { id: 'ORD-002', date: '2024-01-10', items: 2, total: '$15.00', status: 'In Transit' },
    { id: 'ORD-003', date: '2024-01-05', items: 1, total: '$8.99', status: 'Processing' },
  ]

  return (
    <div className={styles.orderHistory}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Order History</h1>
        <p className={styles.pageDescription}>
          View and track all your past orders
        </p>

        <div className={styles.ordersList}>
          {recentOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <h3 className={styles.orderId}>{order.id}</h3>
                  <p className={styles.orderDate}>{order.date}</p>
                </div>
                <span className={`${styles.orderStatus} ${styles[order.status.toLowerCase().replace(' ', '')]}`}>
                  {order.status}
                </span>
              </div>
              <div className={styles.orderDetails}>
                <span>{order.items} items</span>
                <span className={styles.orderTotal}>{order.total}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/tracking/${order.id}`)}
              >
                Track Order
              </Button>
            </div>
          ))}
        </div>

        {recentOrders.length === 0 && (
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


