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
    { title: 'Swap Books', subtitle: 'List & exchange', route: '/exchange', icon: '🔁' },
    { title: 'Nearby Finds', subtitle: 'Books around you', route: '/books', icon: '📍' },
    { title: 'Wishlist', subtitle: 'Saved for later', route: '/wishlist', icon: '💛' },
    { title: 'My Library', subtitle: 'Owned & swapped', route: '/bookshelf', icon: '📚' },
  ]

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.overlay}>
          <h1 className={styles.title}>Explore &amp; Exchange Books</h1>
          <p className={styles.subtitle}>Discover stories from around the world</p>

          <div className={styles.searchWrap}>
            <BookSearchInput
              value={searchText}
              onChange={setSearchText}
              onBookSelect={handleBookSelect}
              placeholder="Search for books or genres..."
              fullWidth
            />
          </div>

          <div className={styles.actionsGrid}>
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className={styles.actionCard}
                onClick={() => navigate(action.route)}
              >
                <span className={styles.actionIcon} aria-hidden>
                  {action.icon}
                </span>
                <span className={styles.actionText}>
                  <span className={styles.actionTitle}>{action.title}</span>
                  <span className={styles.actionSubtitle}>{action.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.featuredSection}>
        <div className={styles.featuredHeader}>
          <h2>Featured Picks for You</h2>
          <button type="button" className={styles.seeAllBtn} onClick={() => navigate('/books')}>
            See All
          </button>
        </div>
        <div className={styles.featuredGrid}>
          <article
            className={`${styles.featuredCard} ${styles.cardAncient}`}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/books')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate('/books')
              }
            }}
            aria-label="Browse books: Lost Cities of the Past"
          >
            <div className={styles.featuredContent}>
              <h3>Lost Cities of the Past</h3>
              <p>History and archaeology treasures</p>
            </div>
          </article>
          <article
            className={`${styles.featuredCard} ${styles.cardFantasy}`}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/books')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate('/books')
              }
            }}
            aria-label="Browse books: Epic Fantasy Adventures"
          >
            <div className={styles.featuredContent}>
              <h3>Epic Fantasy Adventures</h3>
              <p>Castles, dragons, and quests</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

export default Home

