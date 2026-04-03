import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import BookSearchInput from '../../components/shared/BookSearchInput/BookSearchInput'
import type { BookResponse } from '../../utils/api'
import styles from './Home.module.css'

const Home: React.FC = () => {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')

  const handleBookSelect = (book: BookResponse) => {
    router.push(`/exchange?search=${encodeURIComponent(book.title)}`)
  }

  const quickActions = [
    { title: 'Swap Books', subtitle: 'List & exchange', route: '/exchange', icon: '🔁' },
    { title: 'Exchange', subtitle: 'Browse & swap', route: '/exchange', icon: '📚' },
    { title: 'Wishlist', subtitle: 'Saved for later', route: '/wishlist', icon: '💛' },
    { title: 'My Library', subtitle: 'Owned & swapped', route: '/bookshelf', icon: '📖' },
  ]

  const exploreActions = [
    {
      title: 'Browse books',
      subtitle: "See what's available",
      route: '/exchange',
      icon: '🔎',
    },
    {
      title: 'See requests',
      subtitle: 'What others hope to find',
      route: '/requests',
      icon: '💬',
    },
  ]

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.overlay}>
          <h1 className={styles.title}>Explore first — then take part</h1>
          <p className={styles.subtitle}>
            Browse the catalog, read what people are looking for, and feel the circle. When you claim a book, we ask
            you to give back so the shelf stays real.
          </p>

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
                onClick={() => router.push(action.route)}
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

          <p className={styles.exploreLead}>Start with the ecosystem</p>
          <div className={styles.exploreRow}>
            {exploreActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className={styles.exploreCard}
                onClick={() => router.push(action.route)}
              >
                <span className={styles.exploreIcon} aria-hidden>
                  {action.icon}
                </span>
                <span className={styles.exploreText}>
                  <span className={styles.exploreTitle}>{action.title}</span>
                  <span className={styles.exploreSubtitle}>{action.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.featuredSection}>
        <div className={styles.featuredHeader}>
          <h2>Featured Picks for You</h2>
          <button type="button" className={styles.seeAllBtn} onClick={() => router.push('/exchange')}>
            See All
          </button>
        </div>
        <div className={styles.featuredGrid}>
          <article
            className={`${styles.featuredCard} ${styles.cardAncient}`}
            role="button"
            tabIndex={0}
            onClick={() => router.push('/exchange')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push('/exchange')
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
            onClick={() => router.push('/exchange')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push('/exchange')
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

