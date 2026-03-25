import React, { useState } from 'react'
import Button from '../../components/shared/Button/Button'
import styles from './BookPickup.module.css'

const BookPickup: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pickup')

  const tabs = [
    { id: 'pickup', label: 'Pickup' },
    { id: 'blog', label: 'Blog' },
    { id: 'offers', label: 'Offers' },
  ]

  return (
    <div className={styles.pickup}>
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Left Column - Hero Image */}
          <div className={styles.imageColumn}>
            <div className={styles.heroImage}>
              <svg viewBox="0 0 600 400" className={styles.imageSvg}>
                <rect x="50" y="100" width="500" height="250" fill="#ff9800" opacity="0.3" />
                <rect x="100" y="150" width="400" height="150" fill="#ff9800" opacity="0.5" />
                <rect x="150" y="200" width="300" height="100" fill="#ff9800" opacity="0.7" />
                <rect x="80" y="80" width="20" height="30" fill="#4caf50" />
                <rect x="120" y="80" width="20" height="30" fill="#4caf50" />
                <rect x="160" y="80" width="20" height="30" fill="#4caf50" />
              </svg>
            </div>
            <div className={styles.thumbnails}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.thumbnail}>
                  <svg viewBox="0 0 200 200" className={styles.thumbnailSvg}>
                    <rect width="200" height="200" fill="currentColor" opacity="0.2" />
                    <rect x="20" y="20" width="160" height="160" fill="currentColor" opacity="0.3" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Service Details */}
          <div className={styles.detailsColumn}>
            <h1 className={styles.title}>Eco-Friendly Book Pickup</h1>
            <p className={styles.description}>
              Join our initiative to recycle and repurpose books. Our eco-friendly pickup service ensures that your old books find new homes while reducing waste. With convenient scheduling and responsible handling, we make recycling easy.
            </p>

            {/* Tabs */}
            <div className={styles.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contributor Info */}
            <div className={styles.contributorInfo}>
              <div className={styles.contributor}>
                <div className={styles.contributorAvatar}>
                  <svg viewBox="0 0 100 100" className={styles.avatarSvg}>
                    <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.3" />
                    <circle cx="50" cy="35" r="15" fill="currentColor" opacity="0.5" />
                    <rect x="30" y="60" width="40" height="30" fill="currentColor" opacity="0.5" />
                  </svg>
                </div>
                <span className={styles.contributorName}>Samantha Lee</span>
              </div>
              <div className={styles.contributor}>
                <div className={styles.contributorAvatar}>
                  <svg viewBox="0 0 100 100" className={styles.avatarSvg}>
                    <rect x="20" y="20" width="60" height="60" fill="currentColor" opacity="0.3" />
                    <rect x="30" y="30" width="40" height="40" fill="currentColor" opacity="0.5" />
                  </svg>
                </div>
                <span className={styles.contributorName}>Sustainable reading</span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button className={styles.heartButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <Button variant="secondary" fullWidth>
                Get This Book
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookPickup


