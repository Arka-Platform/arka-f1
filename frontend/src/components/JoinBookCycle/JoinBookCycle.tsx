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
        <svg viewBox="0 0 200 200" className={styles.optionIllustration}>
          <rect x="80" y="100" width="20" height="60" fill="#00bcd4" />
          <rect x="105" y="100" width="20" height="60" fill="#9c27b0" />
          <rect x="130" y="100" width="20" height="60" fill="#00bcd4" />
          <rect x="70" y="80" width="60" height="20" fill="currentColor" opacity="0.3" />
        </svg>
      ),
    },
    {
      title: 'As a partner',
      description: 'Collaborate with us to expand the book-sharing community.',
      buttonText: 'Partner up',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.optionIllustration}>
          <path
            d="M100 50 L120 90 L160 90 L130 120 L140 160 L100 135 L60 160 L70 120 L40 90 L80 90 Z"
            fill="currentColor"
            opacity="0.3"
          />
          <circle cx="100" cy="100" r="30" fill="currentColor" opacity="0.2" />
        </svg>
      ),
    },
    {
      title: 'As a team member',
      description: 'Be part of a dedicated team fostering a love for reading.',
      buttonText: 'Join the team',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.optionIllustration}>
          <rect x="80" y="100" width="40" height="50" fill="currentColor" opacity="0.3" />
          <circle cx="100" cy="60" r="20" fill="currentColor" opacity="0.3" />
          <rect x="60" y="40" width="15" height="20" fill="#00bcd4" />
          <rect x="125" y="40" width="15" height="20" fill="#4caf50" />
          <circle cx="70" cy="30" r="5" fill="currentColor" opacity="0.2" />
          <circle cx="130" cy="30" r="5" fill="currentColor" opacity="0.2" />
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

