'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import BookCard, { Book } from '../BookCard/BookCard'
import { recommendationsApi, BookResponse } from '../../../utils/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useCart } from '../../../contexts/CartContext'
import { trackBookView } from '../../../utils/tracking'
import styles from './RecommendationSection.module.css'

interface RecommendationSectionProps {
  title: string
  type: 'personalized' | 'popular' | 'trending'
  category?: string
  limit?: number
  showViewAll?: boolean
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  type,
  category,
  limit = 8,
  showViewAll = false,
}) => {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        let data: BookResponse[] = []

        switch (type) {
          case 'personalized':
            data = await recommendationsApi.getRecommendations(user?.id, limit)
            break
          case 'popular':
            data = await recommendationsApi.getPopular(limit)
            break
          case 'trending':
            if (category) {
              data = await recommendationsApi.getTrending(category, limit)
            }
            break
        }

        setBooks(data.map(bookToCard))
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [type, category, limit, user?.id])

  const bookToCard = (book: BookResponse): Book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description || '',
    genre: book.genre || undefined,
    price: book.price || 0,
    image: book.imageUrl || undefined,
    thumbnail: book.thumbnailUrl || undefined,
    publisher: book.publisher || undefined,
    publicationYear: book.publicationYear || undefined,
    averageRating: book.averageRating || undefined,
    ratingsCount: book.ratingsCount || undefined,
  })

  const handleBookClick = (book: Book) => {
    trackBookView(book.id, 0)
    addToCart(book)
  }

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      return () => {
        container.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
  }, [books])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollAmount = container.clientWidth * 0.8 // Scroll 80% of container width
      const targetScroll = direction === 'left' 
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.loading}>Loading recommendations...</div>
      </section>
    )
  }

  if (books.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {showViewAll && (
          <Link className={styles.viewAll} href="/books">
            View all
          </Link>
        )}
      </div>
      <div className={styles.carouselContainer}>
        {canScrollLeft && (
          <button
            className={`${styles.navButton} ${styles.navButtonLeft}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div 
          className={styles.booksCarousel}
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
        >
          {books.map((book) => (
            <div key={book.id} className={styles.bookCardWrapper}>
              <BookCard
                book={book}
                onButtonClick={handleBookClick}
                buttonText="Get This Book"
                enableUserCollections={false}
              />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button
            className={`${styles.navButton} ${styles.navButtonRight}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

export default RecommendationSection



