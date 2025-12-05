import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
          <Link to="/books" className={styles.viewAll}>
            View All →
          </Link>
        )}
      </div>
      <div className={styles.booksGrid}>
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onButtonClick={handleBookClick}
            buttonText="Add to Cart"
          />
        ))}
      </div>
    </section>
  )
}

export default RecommendationSection



