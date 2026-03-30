import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import BookSearchInput from '../../components/shared/BookSearchInput/BookSearchInput'
import HomeFeed from '../../components/home/HomeFeed'
import type { BookResponse } from '../../utils/api'
import styles from './Home.module.css'

const Home: React.FC = () => {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')

  const handleBookSelect = (book: BookResponse) => {
    router.push(`/books?search=${encodeURIComponent(book.title)}`)
  }

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.overlay}>
          <h1 className={styles.title}>Books move when everyone takes part</h1>
          <p className={styles.subtitle}>
            Offering and looking for a book are the same kind of move — both keep the shelf alive. Pick what you want
            to do first; there is no right order.
          </p>

          <div className={styles.primaryPair} role="group" aria-label="Main actions">
            <button type="button" className={styles.primaryTwin} onClick={() => router.push('/inventory?focus=add')}>
              <span className={styles.primaryTwinTitle}>Offer a Book</span>
              <span className={styles.primaryTwinSub}>Put something in the pool for others</span>
            </button>
            <button type="button" className={styles.primaryTwin} onClick={() => router.push('/books')}>
              <span className={styles.primaryTwinTitle}>Find a Book</span>
              <span className={styles.primaryTwinSub}>See what is available right now</span>
            </button>
          </div>

          <p className={styles.orgHint}>
            <button type="button" className={styles.orgLink} onClick={() => router.push('/donation')}>
              Offering many books to an organization?
            </button>
          </p>

          <div className={styles.searchWrap}>
            <BookSearchInput
              value={searchText}
              onChange={setSearchText}
              onBookSelect={handleBookSelect}
              placeholder="Search titles, authors, genres…"
              fullWidth
            />
          </div>
        </div>
      </section>

      <HomeFeed />
    </div>
  )
}

export default Home
