'use client'

import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Logo.module.css'

interface LogoProps {
  showTagline?: boolean
  size?: 'small' | 'medium' | 'large'
}

const Logo: React.FC<LogoProps> = ({ showTagline = false, size = 'medium' }) => {
  return (
    <Link to="/home" className={styles.logoLink}>
      <div className={`${styles.logoContainer} ${styles[size]}`}>
        <svg
          viewBox="0 0 200 200"
          className={styles.logoIcon}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Large overlapping circles */}
          <circle cx="60" cy="80" r="50" fill="#9c27b0" opacity="0.6" />
          <circle cx="100" cy="50" r="50" fill="#ff9800" opacity="0.6" />
          <circle cx="140" cy="100" r="50" fill="#e91e63" opacity="0.6" />
          
          {/* Overlapping areas (darker) */}
          <circle cx="80" cy="65" r="25" fill="#7b1fa2" opacity="0.8" />
          <circle cx="120" cy="75" r="25" fill="#f57c00" opacity="0.8" />
          <circle cx="110" cy="90" r="25" fill="#c2185b" opacity="0.8" />
          
          {/* White shelf/table inside circles */}
          <rect x="50" y="100" width="100" height="8" fill="white" rx="4" />
          
          {/* Stack of books on left */}
          <rect x="60" y="85" width="20" height="15" fill="white" rx="2" />
          <rect x="62" y="82" width="20" height="15" fill="white" rx="2" />
          
          {/* Potted plant on right */}
          <rect x="130" y="95" width="12" height="13" fill="white" rx="2" />
          <circle cx="136" cy="88" r="4" fill="white" />
          <circle cx="132" cy="85" r="3" fill="white" />
          <circle cx="140" cy="85" r="3" fill="white" />
          
          {/* Small decorative dots */}
          <circle cx="100" cy="30" r="6" fill="#e91e63" />
          <circle cx="50" cy="120" r="6" fill="#ff9800" />
          <circle cx="160" cy="70" r="6" fill="#2196f3" />
        </svg>
      </div>
      <div className={styles.logoText}>
        <span className={styles.brandName}>Arka</span>
        {showTagline && <span className={styles.tagline}>Books in Motion</span>}
      </div>
    </Link>
  )
}

export default Logo


