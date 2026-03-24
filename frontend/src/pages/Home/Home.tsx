import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookSearchInput from '../../components/shared/BookSearchInput/BookSearchInput'
import type { BookResponse } from '../../utils/api'
import styles from './Home.module.css'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')

  const handleBookSelect = (book: BookResponse) => {
    navigate(`/books?search=${encodeURIComponent(book.title)}`)
  }

  const quickActions = [
    { title: 'Swap Books', subtitle: 'List and exchange books', route: '/exchange' },
    { title: 'Nearby Finds', subtitle: 'Discover books around you', route: '/books?nearby=1' },
    { title: 'Wishlist', subtitle: 'View your saved books', route: '/wishlist' },
    { title: 'My Library', subtitle: 'Manage your bookshelf', route: '/bookshelf' },
  ]

  return (
    <div className={styles.home}>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <h1 className={styles.title}>Explore and Exchange Books</h1>
            <p className={styles.subtitle}>Find your next read and connect with the community.</p>
            <div className={styles.searchWrap}>
              <BookSearchInput
                value={searchText}
                onChange={setSearchText}
                onBookSelect={handleBookSelect}
                placeholder="Search for books or genres..."
                fullWidth
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.actionsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className={styles.actionCard}
                onClick={() => navigate(action.route)}
              >
                <span className={styles.actionTitle}>{action.title}</span>
                <span className={styles.actionSubtitle}>{action.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.browseSection}>
        <div className={styles.container}>
          <div className={styles.browseCard}>
            <div>
              <h2 className={styles.sectionTitle}>Browse Marketplace</h2>
              <p className={styles.browseText}>View all listed books and discover new arrivals.</p>
            </div>
            <button type="button" className={styles.browseButton} onClick={() => navigate('/books')}>
              See All Books
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

