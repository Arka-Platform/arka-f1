import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Hero.module.css'

const Hero: React.FC = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/home')
  }

  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.heading}>ARKA</h1>
          {/* <h2 className={styles.subheading}>Spreading Happiness.</h2> */}
          <p className={styles.tagline}>Sustainable Books. Unlimited Possibilities</p>

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

