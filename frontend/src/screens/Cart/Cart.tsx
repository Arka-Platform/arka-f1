import React from 'react'
import Link from 'next/link'
import { useCart } from '../../contexts/CartContext'
import Button from '../../components/shared/Button/Button'
import styles from './Cart.module.css'

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
  const total = getTotalPrice()

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
            <Link href="/circulation">
              <Button variant="primary">Circulation</Button>
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
              <Link href="/circulation" className={styles.continueShopping}>
                Back to Circulation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart




















