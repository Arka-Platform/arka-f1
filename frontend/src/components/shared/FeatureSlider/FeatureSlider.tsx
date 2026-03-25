'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './FeatureSlider.module.css'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  link: string
  color: string
  image: string
  imageFallback: string
  imageAlt: string
}

const features: Feature[] = [
  {
    id: '1',
    title: 'Affordable Books',
    description: 'Get quality used books at unbeatable prices',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    link: '/books',
    color: '#2563eb',
    // Use local image if available, otherwise fallback to Unsplash
    image: '/images/features/affordable-books.jpg',
    imageFallback: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1200&h=600&fit=crop&q=80',
    imageAlt: 'Stack of books on a table',
  },
  {
    id: '2',
    title: 'Book Exchange',
    description: 'Trade books with other readers and earn credits',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 16V4m0 0L3 8m4-4l4 4M7 16l4 4m-4-4v4m10-8V4m0 0l4 4m-4-4l-4 4m4 4l-4-4m4 4v4" />
      </svg>
    ),
    link: '/exchange',
    color: '#10b981',
    image: '/images/features/book-exchange.jpg',
    imageFallback: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop&q=80',
    imageAlt: 'Books being exchanged between hands',
  },
  {
    id: '4',
    title: 'Recycling Program',
    description: 'Recycle paper waste and earn credits',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    ),
    link: '/recycling',
    color: '#ef4444',
    image: '/images/features/recycling-program.jpg',
    imageFallback: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&h=600&fit=crop&q=80',
    imageAlt: 'Recycled paper and books',
  },
]

const FeatureSlider: React.FC = () => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handleFeatureClick = (link: string) => {
    navigate(link)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section className={styles.featureSlider}>
      <div className={styles.container}>
        <div className={styles.sliderWrapper}>
          <button
            className={styles.navButton}
            onClick={goToPrevious}
            aria-label="Previous feature"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className={styles.slidesContainer}>
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
                onClick={() => handleFeatureClick(feature.link)}
              >
                <div
                  className={styles.slideContent}
                  style={{ '--feature-color': feature.color } as React.CSSProperties}
                >
                  <div 
                    className={styles.slideBackground}
                    style={{ backgroundImage: `url(${feature.image}), url(${feature.imageFallback})` }}
                    role="img"
                    aria-label={feature.imageAlt}
                  />
                  <div className={styles.slideOverlay} />
                  <div className={styles.slideTextContent}>
                    <div className={styles.iconWrapper}>{feature.icon}</div>
                    <h3 className={styles.slideTitle}>{feature.title}</h3>
                    <p className={styles.slideDescription}>{feature.description}</p>
                    <span className={styles.learnMore}>Learn More →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className={styles.navButton}
            onClick={goToNext}
            aria-label="Next feature"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className={styles.indicators}>
          {features.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureSlider

