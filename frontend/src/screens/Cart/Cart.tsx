import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { subscriptionsApi } from '../../utils/api'
import Button from '../../components/shared/Button/Button'
import styles from './Cart.module.css'

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const total = getTotalPrice()
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loadingSubscription, setLoadingSubscription] = useState(true)

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) {
        setLoadingSubscription(false)
        return
      }
      
      try {
        const subscription = await subscriptionsApi.getUserSubscription(user.id)
        setHasActiveSubscription(subscription.status === 'ACTIVE')
      } catch (error) {
        // User doesn't have a subscription
        setHasActiveSubscription(false)
      } finally {
        setLoadingSubscription(false)
      }
    }

    checkSubscription()
  }, [user?.id])

  const handleQuantityChange = (bookId: string, newQuantity: number) => {
    updateQuantity(bookId, newQuantity)
  }

  const handleRemove = (bookId: string) => {
    removeFromCart(bookId)
  }

  if (items.length === 0) {
    return (
      <div className={styles.cart}>
        <div className={styles.container}>
          <h1 className={styles.title}>Your Cart</h1>
          <div className={styles.empty}>
            <p className={styles.emptyText}>Your cart is empty</p>
            <Link href="/books">
              <Button variant="primary">Browse Books</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.cart}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Cart</h1>
          <button onClick={clearCart} className={styles.clearButton}>
            Clear Cart
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.itemsSection}>
            {items.map((item) => {
              const price = typeof item.price === 'number' ? item.price : 
                           typeof item.price === 'string' ? parseFloat(item.price.replace('₹', '').replace('$', '')) : 0
              const itemTotal = price * item.quantity

              return (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemTitle}>{item.title}</h3>
                    {item.author && (
                      <p className={styles.itemAuthor}>by {item.author}</p>
                    )}
                    {item.genre && (
                      <span className={styles.itemGenre}>{item.genre}</span>
                    )}
                    <p className={styles.itemPrice}>₹{price.toFixed(2)} each</p>
                  </div>

                  <div className={styles.itemControls}>
                    <div className={styles.quantityControl}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className={styles.quantityButton}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className={styles.quantityButton}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className={styles.itemTotal}>
                      <p className={styles.itemTotalLabel}>Total</p>
                      <p className={styles.itemTotalPrice}>₹{itemTotal.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className={styles.removeButton}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={styles.summarySection}>
            {/* Subscription Upsell - Only show if user doesn't have active subscription */}
            {!loadingSubscription && !hasActiveSubscription && user && (
              <div className={styles.subscriptionUpsell}>
                <div className={styles.subscriptionUpsellHeader}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <h3 className={styles.subscriptionUpsellTitle}>Save on Future Purchases</h3>
                </div>
                <p className={styles.subscriptionUpsellText}>
                  Get 3 books per month for just <strong>₹9.99</strong> with our Basic Plan. 
                  Save up to <strong>₹{Math.max(0, Math.round(total * 0.3))}</strong> on similar purchases!
                </p>
                <div className={styles.subscriptionUpsellBenefits}>
                  <div className={styles.subscriptionUpsellBenefit}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>3 books/month included</span>
                  </div>
                  <div className={styles.subscriptionUpsellBenefit}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Priority recommendations</span>
                  </div>
                  <div className={styles.subscriptionUpsellBenefit}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Cancel anytime</span>
                  </div>
                </div>
                <Link href="/subscriptions">
                  <Button variant="secondary" fullWidth className={styles.subscriptionUpsellButton}>
                    View Plans
                  </Button>
                </Link>
              </div>
            )}

            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <Link href="/order">
                <Button variant="primary" fullWidth className={styles.checkoutButton}>
                  Proceed to Checkout
                </Button>
              </Link>
              <Link href="/books" className={styles.continueShopping}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart




















