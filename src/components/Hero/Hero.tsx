import React, { useState } from 'react'
import styles from './Hero.module.css'

const Hero: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle search logic here
    console.log('Searching for:', searchQuery)
  }

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.illustrationLeft}>
          <div className={styles.donkeyIllustration} aria-hidden="true">
            {/* SVG illustration placeholder - replace with actual SVG */}
            <svg viewBox="0 0 200 200" className={styles.illustrationSvg}>
              <rect x="50" y="100" width="100" height="80" fill="currentColor" opacity="0.3" />
              <rect x="60" y="60" width="20" height="40" fill="#00bcd4" />
              <rect x="85" y="60" width="20" height="40" fill="#ff9800" />
              <rect x="110" y="60" width="20" height="40" fill="#ffeb3b" />
              <rect x="135" y="60" width="20" height="40" fill="#f44336" />
              <rect x="160" y="60" width="20" height="40" fill="#4caf50" />
            </svg>
          </div>
        </div>

        <div className={styles.content}>
          <h1 className={styles.heading}>Your gateway to a sustainable book</h1>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for a Book, Author, Genre etc"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search for books, authors, or genres"
            />
            <button type="button" className={styles.searchIconButton} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button type="submit" className={styles.findButton} aria-label="Find books">Find</button>
          </form>
        </div>

        <div className={styles.illustrationRight}>
          <div className={styles.recycleIllustration} aria-hidden="true">
            {/* SVG illustration placeholder - replace with actual SVG */}
            <svg viewBox="0 0 200 200" className={styles.illustrationSvg}>
              <rect x="80" y="120" width="40" height="60" fill="currentColor" opacity="0.3" />
              <path d="M70 100 L130 100 L120 80 L80 80 Z" fill="currentColor" opacity="0.2" />
              <circle cx="100" cy="60" r="15" fill="currentColor" opacity="0.1" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

