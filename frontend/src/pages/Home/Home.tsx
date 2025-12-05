import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/shared/Button/Button'
import RecommendationSection from '../../components/shared/RecommendationSection/RecommendationSection'
import CircleHub from '../../components/community/CircleHub/CircleHub'
import ChainStories from '../../components/community/ChainStories/ChainStories'
import styles from './Home.module.css'

const Home: React.FC = () => {
  const navigate = useNavigate()

  // Testimonials moved to Landing Page

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroIllustration}>
              <svg viewBox="0 0 400 300" className={styles.illustrationSvg}>
                <rect x="50" y="50" width="300" height="200" fill="currentColor" opacity="0.1" />
                <rect x="100" y="80" width="200" height="140" fill="currentColor" opacity="0.2" />
                <circle cx="200" cy="150" r="30" fill="#4caf50" opacity="0.5" />
                <rect x="120" y="100" width="20" height="30" fill="#4caf50" />
                <rect x="150" y="100" width="20" height="30" fill="#4caf50" />
                <rect x="180" y="100" width="20" height="30" fill="#4caf50" />
              </svg>
            </div>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>Welcome to Arka</h1>
              <p className={styles.heroDescription}>
                Join us in our mission to promote sustainability through book sharing and waste paper recycling.
              </p>
              <Button variant="primary" onClick={() => navigate('/register')}>
                Join Our Community
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CircleHub />
      <ChainStories />

      {/* Waste Paper Pickup Section */}
      <section className={styles.serviceSection}>
        <div className={styles.container}>
          <div className={styles.serviceContent}>
            <div className={styles.serviceText}>
              <h2 className={styles.serviceTitle}>Waste Paper Pickup</h2>
              <p className={styles.serviceDescription}>
                Participate in our waste paper pickup program to contribute to a greener planet. Schedule a pickup today and make a difference.
              </p>
              <Button variant="primary" onClick={() => navigate('/pickup')}>
                Learn More
              </Button>
            </div>
            <div className={styles.serviceIllustration}>
              <svg viewBox="0 0 300 200" className={styles.illustrationSvg}>
                <rect x="50" y="100" width="200" height="80" fill="currentColor" opacity="0.3" />
                <circle cx="150" cy="60" r="25" fill="currentColor" opacity="0.3" />
                <rect x="80" y="120" width="20" height="40" fill="#4caf50" />
                <rect x="110" y="120" width="20" height="40" fill="#4caf50" />
                <rect x="140" y="120" width="20" height="40" fill="#4caf50" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Book Sharing Section */}
      <section className={styles.serviceSection}>
        <div className={styles.container}>
          <div className={`${styles.serviceContent} ${styles.serviceContentReversed}`}>
            <div className={styles.serviceIllustration}>
              <svg viewBox="0 0 300 200" className={styles.illustrationSvg}>
                <circle cx="150" cy="100" r="60" fill="currentColor" opacity="0.2" />
                <circle cx="120" cy="80" r="20" fill="currentColor" opacity="0.3" />
                <circle cx="180" cy="80" r="20" fill="currentColor" opacity="0.3" />
                <circle cx="150" cy="120" r="15" fill="currentColor" opacity="0.3" />
                <rect x="100" y="140" width="100" height="40" fill="currentColor" opacity="0.2" />
              </svg>
            </div>
            <div className={styles.serviceText}>
              <h2 className={styles.serviceTitle}>Book Sharing</h2>
              <p className={styles.serviceDescription}>
                Discover a world of literature by sharing and borrowing books within our community. Let's reduce waste and promote reading together.
              </p>
              <Button variant="primary" onClick={() => navigate('/books')}>
                Explore Books
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <RecommendationSection
        title="Recommended for You"
        type="personalized"
        limit={6}
        showViewAll
      />
      
      <RecommendationSection
        title="Popular This Week"
        type="popular"
        limit={6}
        showViewAll
      />
    </div>
  )
}

export default Home

