import React, { useState } from 'react'
import styles from './HowItWorks.module.css'

interface Step {
  title: string
  description: string
  illustration: React.ReactNode
}

const HowItWorks: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true)

  const steps: Step[] = [
    {
      title: 'List Your Books',
      description:
        'Add your books to your bookshelf with details like title, author, condition, and price. Our platform makes it easy to create listings.',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.stepIllustration}>
          <rect x="50" y="30" width="100" height="140" fill="currentColor" opacity="0.2" />
          <rect x="60" y="50" width="80" height="100" fill="currentColor" opacity="0.3" />
          <line x1="70" y1="70" x2="130" y2="70" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="70" y1="90" x2="130" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="70" y1="110" x2="100" y2="110" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        </svg>
      ),
    },
    {
      title: 'Buyers Discover',
      description:
        'Buyers browse your books, read descriptions, and see condition details. They can search by category, price, or author to find exactly what they want.',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.stepIllustration}>
          <circle cx="100" cy="80" r="30" fill="currentColor" opacity="0.2" />
          <rect x="70" y="120" width="60" height="40" fill="currentColor" opacity="0.3" />
          <circle cx="85" cy="100" r="5" fill="#4caf50" />
          <circle cx="115" cy="100" r="5" fill="#4caf50" />
          <path d="M80 130 Q100 140 120 130" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      ),
    },
    {
      title: 'Complete Transaction',
      description:
        'Once a buyer purchases, you receive payment securely. We handle the transaction and ensure both parties have a smooth experience.',
      illustration: (
        <svg viewBox="0 0 200 200" className={styles.stepIllustration}>
          <rect x="60" y="80" width="80" height="60" fill="currentColor" opacity="0.2" />
          <circle cx="80" cy="110" r="8" fill="#4caf50" />
          <path d="M75 110 L78 113 L85 106" stroke="white" strokeWidth="2" fill="none" />
          <rect x="120" y="100" width="20" height="20" fill="currentColor" opacity="0.3" />
          <line x1="100" y1="110" x2="120" y2="110" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        </svg>
      ),
    },
  ]

  return (
    <section className={styles.howItWorks}>
      <div className={styles.container}>
        <button
          className={styles.sectionHeader}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="how-it-works-content"
        >
          <h2 className={styles.sectionTitle}>How It Works</h2>
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
          <div id="how-it-works-content" className={styles.steps}>
            {steps.map((step, index) => (
              <div key={index} className={styles.step}>
                <div className={styles.stepIllustrationWrapper}>{step.illustration}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default HowItWorks

