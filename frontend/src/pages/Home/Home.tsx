import React from 'react'
import AdBanner from '../../components/shared/AdBanner/AdBanner'
import FeatureSlider from '../../components/shared/FeatureSlider/FeatureSlider'
import RecommendationSection from '../../components/shared/RecommendationSection/RecommendationSection'
import styles from './Home.module.css'

const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      {/* Ad Banner */}
      <AdBanner />

      {/* Feature Slider */}
      <FeatureSlider />

      {/* Recommendations Section */}
      <RecommendationSection
        title="Recommended for You"
        type="personalized"
        limit={6}
      />
      
      <RecommendationSection
        title="Popular This Week"
        type="popular"
        limit={6}
      />
    </div>
  )
}

export default Home

