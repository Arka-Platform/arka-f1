import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { subscriptionsApi, SubscriptionResponse } from '../../utils/api'
import { useToast } from '../../contexts/ToastContext'
import Button from '../../components/shared/Button/Button'
import styles from './Subscriptions.module.css'

const Subscriptions: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      booksPerMonth: 0,
      features: ['Basic book browsing', 'Limited recommendations', 'Community access']
    },
    {
      id: 'BASIC',
      name: 'Basic',
      price: 9.99,
      booksPerMonth: 3,
      features: ['3 books per month', 'Priority recommendations', 'Community access', 'Email support']
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: 19.99,
      booksPerMonth: 10,
      features: ['10 books per month', 'Advanced recommendations', 'Priority support', 'Ad-free experience', 'Early access to new features']
    },
    {
      id: 'UNLIMITED',
      name: 'Unlimited',
      price: 29.99,
      booksPerMonth: null,
      features: ['Unlimited books', 'All premium features', 'Priority support', 'Ad-free experience', 'Exclusive content']
    }
  ]

  useEffect(() => {
    if (user?.id) {
      loadSubscription()
    }
  }, [user?.id])

  const loadSubscription = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const sub = await subscriptionsApi.getUserSubscription(user.id)
      setSubscription(sub)
    } catch (error) {
      // User might not have a subscription yet
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (!user?.id) return
    
    try {
      await subscriptionsApi.create({ userId: user.id, plan: planId })
      success(`Subscribed to ${planId} plan`)
      loadSubscription()
    } catch (error: any) {
      showError(error.message || 'Failed to subscribe')
    }
  }

  const handleRenew = async () => {
    if (!user?.id) return
    
    try {
      await subscriptionsApi.renew(user.id)
      success('Subscription renewed')
      loadSubscription()
    } catch (error: any) {
      showError(error.message || 'Failed to renew subscription')
    }
  }

  const handleCancel = async () => {
    if (!user?.id) return
    
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return
    }
    
    try {
      await subscriptionsApi.cancel(user.id)
      success('Subscription cancelled')
      loadSubscription()
    } catch (error: any) {
      showError(error.message || 'Failed to cancel subscription')
    }
  }

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Subscriptions</h1>

      {subscription && (
        <div className={styles.currentSubscription}>
          <h2>Current Subscription</h2>
          <div className={styles.subscriptionCard}>
            <div className={styles.subscriptionHeader}>
              <div>
                <h3>{subscription.plan} Plan</h3>
                <span className={`${styles.status} ${styles[subscription.status.toLowerCase()]}`}>
                  {subscription.status}
                </span>
              </div>
              {subscription.monthlyPrice !== null && (
                <div className={styles.price}>
                  ${subscription.monthlyPrice.toFixed(2)}/month
                </div>
              )}
            </div>
            
            <div className={styles.subscriptionDetails}>
              {subscription.unlimitedAccess ? (
                <p>Unlimited books per month</p>
              ) : subscription.booksPerMonth !== null && (
                <p>
                  {subscription.booksUsedThisMonth || 0} / {subscription.booksPerMonth} books used this month
                </p>
              )}
              <p>Start Date: {new Date(subscription.startDate).toLocaleDateString()}</p>
              {subscription.endDate && (
                <p>End Date: {new Date(subscription.endDate).toLocaleDateString()}</p>
              )}
              <p>Auto-renew: {subscription.autoRenew ? 'Yes' : 'No'}</p>
            </div>

            <div className={styles.subscriptionActions}>
              {subscription.status === 'ACTIVE' && (
                <>
                  <Button variant="primary" onClick={handleRenew}>
                    Renew Now
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancel Subscription
                  </Button>
                </>
              )}
              {subscription.status === 'EXPIRED' && (
                <Button variant="primary" onClick={handleRenew}>
                  Renew Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.plansSection}>
        <h2>{subscription ? 'Upgrade Plan' : 'Choose a Plan'}</h2>
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${
                subscription?.plan === plan.id ? styles.currentPlan : ''
              }`}
            >
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <div className={styles.planPrice}>
                  ${plan.price.toFixed(2)}
                  <span className={styles.planPeriod}>/month</span>
                </div>
              </div>
              
              <ul className={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>

              {plan.booksPerMonth !== null && (
                <div className={styles.booksLimit}>
                  {plan.booksPerMonth === 0 ? 'No books included' : `${plan.booksPerMonth} books/month`}
                </div>
              )}
              {plan.booksPerMonth === null && (
                <div className={styles.booksLimit}>Unlimited books</div>
              )}

              <Button
                variant={subscription?.plan === plan.id ? 'secondary' : 'primary'}
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscription?.plan === plan.id}
              >
                {subscription?.plan === plan.id ? 'Current Plan' : 'Subscribe'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Subscriptions



