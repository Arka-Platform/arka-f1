import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { usersApi, trustScoreApi } from '../../utils/api'
import Input from '../../components/shared/Input/Input'
import Textarea from '../../components/shared/Textarea/Textarea'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import TrustScoreBadge from '../../components/shared/TrustScoreBadge/TrustScoreBadge'
import styles from './Account.module.css'

const Account: React.FC = () => {
  const { user, logout } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'orderPreferences'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [trustScore, setTrustScore] = useState<number | null>(null)

  // Set active tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'settings', 'orderPreferences'].includes(tab)) {
      setActiveTab(tab as typeof activeTab)
    }
  }, [searchParams])

  // Load user data and trust score
  useEffect(() => {
    if (user?.id) {
      loadUserData()
      loadTrustScore()
    }
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('arka_user_settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        // Ignore parse errors
      }
    }
    // Load order preferences from localStorage if available
    const savedPrefs = localStorage.getItem('arka_order_preferences')
    if (savedPrefs) {
      try {
        setOrderPreferences(JSON.parse(savedPrefs))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [user?.id])

  const loadUserData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const userData = await usersApi.getById(user.id)
      setProfileData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: '', // Not in backend yet
        address: '', // Not in backend yet
        bio: '', // Not in backend yet
      })
    } catch (error: any) {
      console.error('Error loading user data:', error)
      // If user not found, it might be a stale session - clear auth and redirect
      if (error.message && (error.message.includes('User not found') || error.status === 404)) {
        showError('Your session has expired. Please log in again.')
        logout()
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadTrustScore = async () => {
    if (!user?.id) return
    
    try {
      const scoreData = await trustScoreApi.getTrustScore(user.id)
      setTrustScore(scoreData.trustScore)
    } catch (error: any) {
      // Trust score is optional, so don't show error to user
      // Only log if it's not a "user not found" error (which is expected for new users)
      if (error.message && !error.message.includes('User not found')) {
        console.error('Error loading trust score:', error)
      }
      // Set trust score to null to indicate it's not available
      setTrustScore(null)
    }
  }

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
  })

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newsletter: true,
  })

  const [orderPreferences, setOrderPreferences] = useState({
    defaultPickupTime: 'asap',
    defaultPaymentMethod: 'credit',
    defaultAddress: '123 Green Street, Eco City, EC 12345',
    savePaymentInfo: false,
  })

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSettingsChange = (field: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    
    try {
      setSaving(true)
      await usersApi.update(user.id, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
      })
      success('Profile updated successfully!')
      await loadUserData() // Reload to get latest data
    } catch (error: any) {
      showError(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      // TODO: Implement backend API for saving user settings
      // For now, just save to localStorage
      localStorage.setItem('arka_user_settings', JSON.stringify(settings))
      success('Settings saved successfully!')
    } catch (error: any) {
      showError(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.account}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading account...</div>
        </div>
      </div>
    )
  }

  // If user is not authenticated, show message
  if (!user) {
    return (
      <div className={styles.account}>
        <div className={styles.container}>
          <div className={styles.authPrompt}>
            <p>Please log in to view your account.</p>
            <Link href="/login" className={styles.loginButton}>Log In</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.account}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>My Account</h1>

        <div className={styles.content}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>
                <svg viewBox="0 0 100 100" className={styles.avatarSvg}>
                  <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.3" />
                  <circle cx="50" cy="35" r="15" fill="currentColor" opacity="0.5" />
                  <rect x="30" y="60" width="40" height="30" fill="currentColor" opacity="0.5" />
                </svg>
              </div>
              <h2 className={styles.profileName}>
                {profileData.firstName || user?.firstName} {profileData.lastName || user?.lastName}
              </h2>
              <p className={styles.profileEmail}>{profileData.email || user?.email}</p>
              {trustScore !== null && (
                <div className={styles.trustScoreContainer}>
                  <TrustScoreBadge trustScore={trustScore} size="medium" showLabel={true} />
                </div>
              )}
            </div>

            <nav className={styles.nav}>
              <button
                className={`${styles.navButton} ${activeTab === 'profile' ? styles.active : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                className={`${styles.navButton} ${activeTab === 'settings' ? styles.active : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
              <button
                className={`${styles.navButton} ${activeTab === 'orderPreferences' ? styles.active : ''}`}
                onClick={() => setActiveTab('orderPreferences')}
              >
                Order Preferences
              </button>
              <Link href="/subscriptions" className={styles.navLink}>
                Subscriptions
              </Link>
              <Link href="/analytics" className={styles.navLink}>
                Analytics
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {activeTab === 'profile' && (
              <div className={styles.tabContent}>
                <h2 className={styles.tabTitle}>Profile Information</h2>
                <form className={styles.form}>
                  <div className={styles.row}>
                    <Input
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      fullWidth
                    />
                    <Input
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      fullWidth
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Address"
                    value={profileData.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    fullWidth
                  />
                  <Textarea
                    label="Bio"
                    value={profileData.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    fullWidth
                  />
                  <Button type="button" variant="primary" onClick={handleSaveProfile} disabled={saving || loading}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className={styles.tabContent}>
                <h2 className={styles.tabTitle}>Account Settings</h2>
                <div className={styles.settingsList}>
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Email Notifications</h3>
                      <p className={styles.settingDescription}>
                        Receive email updates about your orders and account activity
                      </p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>SMS Notifications</h3>
                      <p className={styles.settingDescription}>
                        Receive SMS updates about your orders
                      </p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) => handleSettingsChange('smsNotifications', e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Newsletter</h3>
                      <p className={styles.settingDescription}>
                        Subscribe to our newsletter for updates and promotions
                      </p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={settings.newsletter}
                        onChange={(e) => handleSettingsChange('newsletter', e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
                  <Button type="button" variant="primary" onClick={handleSaveSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
              </div>
            )}

            {activeTab === 'orderPreferences' && (
              <div className={styles.tabContent}>
                <h2 className={styles.tabTitle}>Order Preferences</h2>
                <p className={styles.tabDescription}>
                  Set your default preferences for placing orders. These will be pre-filled when you create a new order.
                </p>
                <form className={styles.form}>
                  <Input
                    label="Default Address"
                    value={orderPreferences.defaultAddress}
                    onChange={(e) => setOrderPreferences((prev) => ({ ...prev, defaultAddress: e.target.value }))}
                    fullWidth
                  />
                  <Select
                    label="Default Pickup Time"
                    options={[
                      { value: 'asap', label: 'As soon as possible' },
                      { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
                      { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
                      { value: 'evening', label: 'Evening (5 PM - 8 PM)' },
                    ]}
                    value={orderPreferences.defaultPickupTime}
                    onChange={(e) => setOrderPreferences((prev) => ({ ...prev, defaultPickupTime: e.target.value }))}
                    fullWidth
                  />
                  <Select
                    label="Default Payment Method"
                    options={[
                      { value: 'credit', label: 'Credit Card' },
                      { value: 'debit', label: 'Debit Card' },
                      { value: 'paypal', label: 'PayPal' },
                      { value: 'cash', label: 'Cash on Delivery' },
                    ]}
                    value={orderPreferences.defaultPaymentMethod}
                    onChange={(e) => setOrderPreferences((prev) => ({ ...prev, defaultPaymentMethod: e.target.value }))}
                    fullWidth
                  />
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Save Payment Information</h3>
                      <p className={styles.settingDescription}>
                        Securely save your payment methods for faster checkout
                      </p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={orderPreferences.savePaymentInfo}
                        onChange={(e) => setOrderPreferences((prev) => ({ ...prev, savePaymentInfo: e.target.checked }))}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={async () => {
                      try {
                        setSaving(true)
                        // TODO: Implement backend API for saving order preferences
                        // For now, just save to localStorage
                        localStorage.setItem('arka_order_preferences', JSON.stringify(orderPreferences))
                        success('Order preferences saved successfully!')
                      } catch (error: any) {
                        showError(error.message || 'Failed to save preferences')
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Account

