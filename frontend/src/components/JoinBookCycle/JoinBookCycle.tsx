import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './JoinBookCycle.module.css'

interface JoinOption {
  title: string
  description: string
  buttonText: string
  illustration: React.ReactNode
}

const JoinBookCycle: React.FC = () => {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(true)

  const options: JoinOption[] = [
    {
      title: 'As a contributor',
      description: 'Help promote sustainability by sharing and recycling books.',
      buttonText: 'Join us',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.optionIllustration} aria-hidden="true">
          {/* Hand giving/sharing */}
          <circle cx="100" cy="100" r="70" fill="#4A90E2" opacity="0.2" />
          <path d="M 100 50 Q 80 60 70 80 Q 60 100 70 120 Q 80 140 100 150 Q 120 140 130 120 Q 140 100 130 80 Q 120 60 100 50" 
                fill="#4A90E2" />
          {/* Book icon */}
          <rect x="85" y="110" width="30" height="40" fill="#50C878" rx="2" />
          <line x1="100" y1="110" x2="100" y2="150" stroke="#2E7D32" strokeWidth="2" />
          {/* Heart symbol */}
          <path d="M 100 160 Q 90 155 85 150 Q 80 145 80 140 Q 80 135 85 132 Q 90 130 100 135 Q 110 130 115 132 Q 120 135 120 140 Q 120 145 115 150 Q 110 155 100 160" 
                fill="#FF6B6B" />
        </svg>
      ),
    },
    {
      title: 'As a partner',
      description: 'Collaborate with us to expand the book-sharing community.',
      buttonText: 'Partner up',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.optionIllustration} aria-hidden="true">
          {/* Handshake/partnership */}
          <circle cx="100" cy="100" r="70" fill="#FFB84D" opacity="0.2" />
          {/* Left hand */}
          <ellipse cx="70" cy="110" rx="25" ry="35" fill="#FF9500" />
          <rect x="55" y="100" width="30" height="25" fill="#FF9500" rx="5" />
          {/* Right hand */}
          <ellipse cx="130" cy="110" rx="25" ry="35" fill="#FF9500" />
          <rect x="115" y="100" width="30" height="25" fill="#FF9500" rx="5" />
          {/* Connection line */}
          <line x1="95" y1="110" x2="105" y2="110" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" />
          {/* Star for partnership */}
          <path d="M 100 50 L 105 65 L 120 65 L 108 75 L 113 90 L 100 80 L 87 90 L 92 75 L 80 65 L 95 65 Z" 
                fill="#FFD700" />
        </svg>
      ),
    },
    {
      title: 'As a team member',
      description: 'Be part of a dedicated team fostering a love for reading.',
      buttonText: 'Join the team',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.optionIllustration} aria-hidden="true">
          {/* Team of people */}
          <circle cx="100" cy="100" r="70" fill="#9B59B6" opacity="0.2" />
          {/* Person 1 */}
          <circle cx="70" cy="80" r="15" fill="#6C5CE7" />
          <rect x="55" y="95" width="30" height="40" fill="#6C5CE7" rx="5" />
          {/* Person 2 (center) */}
          <circle cx="100" cy="70" r="18" fill="#9B59B6" />
          <rect x="82" y="88" width="36" height="50" fill="#9B59B6" rx="5" />
          {/* Person 3 */}
          <circle cx="130" cy="80" r="15" fill="#6C5CE7" />
          <rect x="115" y="95" width="30" height="40" fill="#6C5CE7" rx="5" />
          {/* Connection lines */}
          <line x1="85" y1="90" x2="95" y2="85" stroke="#8E44AD" strokeWidth="3" strokeLinecap="round" />
          <line x1="105" y1="85" x2="115" y2="90" stroke="#8E44AD" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <section className={styles.joinBookCycle}>
      <div className={styles.container}>
        <button
          className={styles.sectionHeader}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="join-bookcycle-content"
        >
          <h2 className={styles.sectionTitle}>Join Arka</h2>
          <svg
            className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isExpanded && (
          <div id="join-bookcycle-content" className={styles.options}>
            {options.map((option, index) => (
              <div key={index} className={styles.option}>
                <div className={styles.optionIllustrationWrapper}>{option.illustration}</div>
                <div className={styles.optionContent}>
                  <h3 className={styles.optionTitle}>{option.title}</h3>
                  <p className={styles.optionDescription}>{option.description}</p>
                  <button 
                    className={styles.optionButton}
                    onClick={() => navigate('/register')}
                    type="button"
                  >
                    {option.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default JoinBookCycle

