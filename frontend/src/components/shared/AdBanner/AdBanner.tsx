'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import styles from './AdBanner.module.css'

const AdBanner: React.FC = () => {
  const router = useRouter()

  const handleBannerClick = () => {
    router.push('/circulation')
  }

  return (
    <div className={styles.adBanner} onClick={handleBannerClick}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerText}>
          <h2 className={styles.bannerTitle}>Give a Book, Take a Book!</h2>
          <p className={styles.bannerSubtitle}>Just Free books, circulating among readers.</p>
        </div>
        <div className={styles.bannerCta}>
          <span className={styles.ctaText}>Share Now →</span>
        </div>
      </div>
    </div>
  )
}

export default AdBanner

