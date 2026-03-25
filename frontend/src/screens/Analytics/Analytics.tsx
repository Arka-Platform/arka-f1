import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { analyticsApi, UserAnalyticsResponse, PlatformInsightsResponse } from '../../utils/api'
import { useToast } from '../../contexts/ToastContext'
import styles from './Analytics.module.css'

const Analytics: React.FC = () => {
  const { user } = useAuth()
  const { error: showError } = useToast()
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsResponse | null>(null)
  const [platformInsights, setPlatformInsights] = useState<PlatformInsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'user' | 'platform'>('user')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [userData, platformData] = await Promise.all([
        user?.id ? analyticsApi.getUserAnalytics(user.id).catch(() => null) : Promise.resolve(null),
        analyticsApi.getPlatformInsights()
      ])
      setUserAnalytics(userData)
      setPlatformInsights(platformData)
    } catch (error) {
      showError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading analytics...</div></div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Analytics & Insights</h1>

      <div className={styles.tabs}>
        {user?.id && (
          <button
            className={`${styles.tab} ${activeTab === 'user' ? styles.active : ''}`}
            onClick={() => setActiveTab('user')}
          >
            My Analytics
          </button>
        )}
        <button
          className={`${styles.tab} ${activeTab === 'platform' ? styles.active : ''}`}
          onClick={() => setActiveTab('platform')}
        >
          Platform Insights
        </button>
      </div>

      {activeTab === 'user' && userAnalytics && (
        <div className={styles.userAnalytics}>
          <h2>Your Reading Statistics</h2>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{userAnalytics.totalBooksRead}</div>
              <div className={styles.statLabel}>Books Read</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{userAnalytics.totalBooksBought}</div>
              <div className={styles.statLabel}>Books Bought</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{userAnalytics.totalBooksSold}</div>
              <div className={styles.statLabel}>Books Sold</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{userAnalytics.totalBooksLent}</div>
              <div className={styles.statLabel}>Books Lent</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{userAnalytics.totalBooksBorrowed}</div>
              <div className={styles.statLabel}>Books Borrowed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{userAnalytics.readingStreak}</div>
              <div className={styles.statLabel}>Day Streak</div>
            </div>
          </div>

          <div className={styles.financialStats}>
            <h3>Financial Overview</h3>
            <div className={styles.financialGrid}>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Total Spent</div>
                <div className={styles.financialValue}>₹{userAnalytics.totalSpent.toFixed(2)}</div>
              </div>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Total Earned</div>
                <div className={styles.financialValue}>₹{userAnalytics.totalEarned.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {userAnalytics.favoriteGenres.length > 0 && (
            <div className={styles.favorites}>
              <h3>Favorite Genres</h3>
              <div className={styles.tags}>
                {userAnalytics.favoriteGenres.map((genre, index) => (
                  <span key={index} className={styles.tag}>{genre}</span>
                ))}
              </div>
            </div>
          )}

          {userAnalytics.favoriteCategories.length > 0 && (
            <div className={styles.favorites}>
              <h3>Favorite Categories</h3>
              <div className={styles.tags}>
                {userAnalytics.favoriteCategories.map((category, index) => (
                  <span key={index} className={styles.tag}>{category}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'platform' && platformInsights && (
        <div className={styles.platformInsights}>
          <h2>Platform Overview</h2>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{platformInsights.totalUsers.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Users</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{platformInsights.activeUsers.toLocaleString()}</div>
              <div className={styles.statLabel}>Active Users</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{platformInsights.totalBooks.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Books</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{platformInsights.availableBooks.toLocaleString()}</div>
              <div className={styles.statLabel}>Available Books</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{platformInsights.totalExchanges.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Exchanges</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{platformInsights.totalLendings.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Lendings</div>
            </div>
          </div>

          <div className={styles.revenueSection}>
            <h3>Revenue</h3>
            <div className={styles.revenueCard}>
              <div className={styles.revenueValue}>₹{platformInsights.totalRevenue.toFixed(2)}</div>
              <div className={styles.revenueLabel}>Total Revenue</div>
            </div>
            <div className={styles.revenueCard}>
              <div className={styles.revenueValue}>₹{platformInsights.averageBookPrice.toFixed(2)}</div>
              <div className={styles.revenueLabel}>Average Book Price</div>
            </div>
          </div>

          {platformInsights.trendingBooks.length > 0 && (
            <div className={styles.trendingSection}>
              <h3>Trending Books</h3>
              <div className={styles.trendingList}>
                {platformInsights.trendingBooks.slice(0, 10).map((book, index) => (
                  <div key={index} className={styles.trendingItem}>
                    <div className={styles.trendingRank}>#{index + 1}</div>
                    <div className={styles.trendingInfo}>
                      <div className={styles.trendingTitle}>{book.title}</div>
                      <div className={styles.trendingAuthor}>by {book.author}</div>
                    </div>
                    <div className={styles.trendingStats}>
                      <div>{book.views} views</div>
                      <div>{book.purchases} purchases</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {platformInsights.popularGenres.length > 0 && (
            <div className={styles.genresSection}>
              <h3>Popular Genres</h3>
              <div className={styles.genresList}>
                {platformInsights.popularGenres.map((genre, index) => (
                  <div key={index} className={styles.genreItem}>
                    <div className={styles.genreName}>{genre.genre}</div>
                    <div className={styles.genreStats}>
                      <span>{genre.bookCount} books</span>
                      <span>{genre.exchangeCount} exchanges</span>
                      <span>₹{genre.averagePrice.toFixed(2)} avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.timeStats}>
            <div className={styles.timeStatCard}>
              <h4>This Month</h4>
              <div className={styles.timeStatDetails}>
                <div>New Users: {platformInsights.monthlyStats.newUsers}</div>
                <div>New Books: {platformInsights.monthlyStats.newBooks}</div>
                <div>Exchanges: {platformInsights.monthlyStats.exchanges}</div>
                <div>Lendings: {platformInsights.monthlyStats.lendings}</div>
                <div>Revenue: ₹{platformInsights.monthlyStats.revenue.toFixed(2)}</div>
              </div>
            </div>
            <div className={styles.timeStatCard}>
              <h4>This Week</h4>
              <div className={styles.timeStatDetails}>
                <div>New Users: {platformInsights.weeklyStats.newUsers}</div>
                <div>New Books: {platformInsights.weeklyStats.newBooks}</div>
                <div>Exchanges: {platformInsights.weeklyStats.exchanges}</div>
                <div>Lendings: {platformInsights.weeklyStats.lendings}</div>
                <div>Revenue: ₹{platformInsights.weeklyStats.revenue.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics



