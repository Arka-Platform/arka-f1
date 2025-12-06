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
        <img 
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop&q=80" 
          alt="Contributor"
          className={styles.optionIllustration}
        />
      ),
    },
    {
      title: 'As a partner',
      description: 'Collaborate with us to expand the book-sharing community.',
      buttonText: 'Partner up',
      illustration: (
        <img 
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=400&fit=crop&q=80" 
          alt="Partner"
          className={styles.optionIllustration}
        />
      ),
    },
    {
      title: 'As a team member',
      description: 'Be part of a dedicated team fostering a love for reading.',
      buttonText: 'Join the team',
      illustration: (
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop&q=80" 
          alt="Team member"
          className={styles.optionIllustration}
        />
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

