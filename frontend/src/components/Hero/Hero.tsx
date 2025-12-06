import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Hero.module.css'

const Hero: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/books')
    }
  }

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.illustrationLeft}>
          <div className={styles.donkeyIllustration} aria-hidden="true">
            <img 
              src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=400&fit=crop&q=80" 
              alt="Books on shelf"
              className={styles.illustrationImage}
            />
          </div>
        </div>

        <div className={styles.content}>
          <h1 className={styles.heading}>All About Books.</h1>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for a Book, Author, Genre etc"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search for books, authors, or genres"
            />
            <button type="submit" className={styles.findButton} aria-label="Find books">Find</button>
          </form>
        </div>

        <div className={styles.illustrationRight}>
          <div className={styles.recycleIllustration} aria-hidden="true">
            <img 
              src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=400&fit=crop&q=80" 
              alt="Recycling books"
              className={styles.illustrationImage}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

