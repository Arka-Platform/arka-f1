import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { ordersApi, CreateOrderRequest } from '../../utils/api'
import Input from '../../components/shared/Input/Input'
import Textarea from '../../components/shared/Textarea/Textarea'
import Button from '../../components/shared/Button/Button'
import styles from './Order.module.css'

const Order: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, getTotalPrice, clearCart } = useCart()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    contactNo: '',
    email: user?.email || '',
    address: '',
    instructions: '',
    pickupTime: 'asap',
    paymentMethod: 'credit',
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (items.length === 0) {
      navigate('/cart')
      return
    }
  }, [user, items, navigate])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setLoading(true)
      const orderRequest: CreateOrderRequest = {
        items: items.map(item => ({
          bookId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: formData.address,
        pickupTime: formData.pickupTime,
        paymentMethod: formData.paymentMethod,
        contactPhone: formData.contactNo,
        specialInstructions: formData.instructions,
      }

      const order = await ordersApi.create(user.id, orderRequest)
      success('Order placed successfully!')
      clearCart()
      navigate(`/tracking/${order.id}`)
    } catch (err: any) {
      showError(err.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = getTotalPrice()
  const pickupFee = 1.00
  const total = subtotal + pickupFee

  return (
    <div className={styles.order}>
      <div className={styles.container}>
        <div className={styles.mainContent}>
          {/* Header */}
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate('/cart')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Return to Cart
            </button>
            <h1 className={styles.title}>Your Order</h1>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* User Details */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>User Details</h2>
              <div className={styles.row}>
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  fullWidth
                  required
                />
              </div>
              <div className={styles.row}>
                <Input
                  label="Contact No."
                  value={formData.contactNo}
                  onChange={(e) => handleInputChange('contactNo', e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  fullWidth
                  required
                />
              </div>
            </section>

            {/* Pickup Location */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Where should we pick up your books?</h2>
              <Input
                placeholder="Search Addresses in your area..."
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                fullWidth
                required
              />
              <Textarea
                placeholder="Additional instructions for pickup..."
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                fullWidth
              />
            </section>

            {/* Pickup Time */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>When should we pick them up?</h2>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="pickupTime"
                    value="asap"
                    checked={formData.pickupTime === 'asap'}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    className={styles.radio}
                  />
                  <span>As soon as possible</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="pickupTime"
                    value="later"
                    checked={formData.pickupTime === 'later'}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    className={styles.radio}
                  />
                  <span>Later (Select time)</span>
                </label>
              </div>
            </section>

            {/* Payment Method */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>How would you like to pay?</h2>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit"
                    checked={formData.paymentMethod === 'credit'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className={styles.radio}
                  />
                  <span>Credit Card</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className={styles.radio}
                  />
                  <span>Cash on pickup</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className={styles.radio}
                  />
                  <span>PayPal / Venmo</span>
                </label>
              </div>
            </section>

            <Button type="submit" variant="secondary" fullWidth className={styles.submitButton} disabled={loading}>
              {loading ? 'Placing Order...' : 'Confirm order'}
            </Button>
          </form>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.serviceCard}>
            <div className={styles.serviceIcon}>
              <svg viewBox="0 0 100 100" className={styles.iconSvg}>
                <rect x="20" y="20" width="60" height="60" fill="currentColor" opacity="0.3" />
                <rect x="30" y="10" width="40" height="20" fill="currentColor" opacity="0.2" />
              </svg>
            </div>
            <h3 className={styles.serviceTitle}>Used Books</h3>
            <p className={styles.serviceRating}>★ 4.9</p>
            <p className={styles.serviceDetails}>Min. • 1.00 • 2-5 days</p>
          </div>

          <div className={styles.cartCard}>
            <div className={styles.cartHeader}>
              <h3 className={styles.cartTitle}>Your Cart</h3>
              <button className={styles.editButton} onClick={() => navigate('/cart')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <p className={styles.cartItems}>{items.length} item{items.length !== 1 ? 's' : ''}</p>
            <div className={styles.bookThumbnails}>
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className={styles.thumbnail} />
              ))}
            </div>
            <p className={styles.cartTotal}>₹{subtotal.toFixed(2)}</p>
          </div>

          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Pickup</span>
              <span>₹{pickupFee.toFixed(2)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total to pay:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Order
