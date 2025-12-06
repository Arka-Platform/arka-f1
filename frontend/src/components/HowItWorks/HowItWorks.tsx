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
        <img 
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80" 
          alt="List your books"
          className={styles.stepIllustration}
        />
      ),
    },
    {
      title: 'Buyers Discover',
      description:
        'Buyers browse your books, read descriptions, and see condition details. They can search by category, price, or author to find exactly what they want.',
      illustration: (
        <img 
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&q=80" 
          alt="Buyers discover books"
          className={styles.stepIllustration}
        />
      ),
    },
    {
      title: 'Complete Transaction',
      description:
        'Once a buyer purchases, you receive payment securely. We handle the transaction and ensure both parties have a smooth experience.',
      illustration: (
        <img 
          src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&h=400&fit=crop&q=80" 
          alt="Complete transaction"
          className={styles.stepIllustration}
        />
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

