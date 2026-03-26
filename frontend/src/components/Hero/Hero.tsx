'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import styles from './Hero.module.css'

const Hero: React.FC = () => {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/home')
  }

  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.heading}>ARKA</h1>
          <h2 className={styles.subheading}>Book Circulation Platform</h2>
          <p className={styles.tagline}>Affordable Reads. Sustainable Books. Unlimited Possibilities.</p>

          <button 
            onClick={handleGetStarted} 
            className={styles.getStartedButton}
            aria-label="Get started"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero

