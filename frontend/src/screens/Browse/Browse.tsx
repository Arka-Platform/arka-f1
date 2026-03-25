import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Browse.module.css'
import { browseBooks } from '../../lib/browseBooks'

const formatInr = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

const Browse: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Browse books</h1>
            <p className={styles.subtitle}>
              Clean collection layout with strong covers, quiet metadata, and generous spacing.
            </p>
          </div>
        </header>

        <section className={styles.grid}>
          {browseBooks.map((b) => (
            <Link key={b.id} to={`/books/${b.id}`} className={styles.card} aria-label={`View ${b.title}`}>
              <div className={styles.cover} role="presentation">
                <div className={styles.coverInner}>
                  <div className={styles.coverTitle}>{b.title}</div>
                  <div className={styles.coverAuthor}>by {b.author}</div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.rowTop}>
                  <div className={styles.metaBlock}>
                    <div className={styles.bookTitle}>{b.title}</div>
                    <div className={styles.bookAuthor}>{b.author}</div>
                  </div>
                  <div className={styles.price}>{formatInr(b.priceInr)}</div>
                </div>

                <div className={styles.rowMid}>
                  <div className={styles.genre}>{b.genre}</div>
                  <div className={styles.rating}>
                    <span className={styles.star}>★</span>
                    <span className={styles.ratingValue}>{b.rating.toFixed(1)}</span>
                    <span className={styles.ratingCount}>({b.ratingCount.toLocaleString('en-IN')})</span>
                  </div>
                </div>

                <div className={styles.pills}>
                  <span className={styles.pill}>Condition</span>
                  <span className={styles.pillValue}>{b.condition}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  )
}

export default Browse

