import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { communityApi, CommunityCircleResponse, BookResponse } from '../../utils/api'
import BookCard, { Book } from '../../components/shared/BookCard/BookCard'
import { useCart } from '../../contexts/CartContext'
import Button from '../../components/shared/Button/Button'
import styles from './CircleDetail.module.css'

const CircleDetail: React.FC = () => {
  const { circleId } = useParams<{ circleId: string }>()
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const { addToCart } = useCart()
  const [circle, setCircle] = useState<CommunityCircleResponse | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [booksLoading, setBooksLoading] = useState(true)

  useEffect(() => {
    if (circleId) {
      loadCircle()
      loadBooks()
    }
  }, [circleId])

  const loadCircle = async () => {
    if (!circleId) return
    try {
      setLoading(true)
      const data = await communityApi.getCircleById(circleId)
      setCircle(data)
    } catch (error: any) {
      showError('Failed to load circle details')
      console.error('Error loading circle:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBooks = async () => {
    if (!circleId) return
    try {
      setBooksLoading(true)
      const data = await communityApi.getCircleBooks(circleId, 0, 20)
      setBooks(data.map(bookToCard))
    } catch (error: any) {
      showError('Failed to load circle books')
      console.error('Error loading books:', error)
    } finally {
      setBooksLoading(false)
    }
  }

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
    addToCart(book)
  }

  if (loading) {
    return (
      <div className={styles.circleDetail}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading circle details...</div>
        </div>
      </div>
    )
  }

  if (!circle) {
    return (
      <div className={styles.circleDetail}>
        <div className={styles.container}>
          <div className={styles.error}>
            <p>Circle not found</p>
            <Button variant="primary" onClick={() => navigate('/home')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.circleDetail}>
      <div className={styles.container}>
        <Button variant="outline" onClick={() => navigate('/home')} className={styles.backButton}>
          ← Back to Circles
        </Button>

        <div className={styles.circleHeader}>
          <div className={styles.circleBadge}>{circle.badge}</div>
          <div>
            <h1 className={styles.circleName}>{circle.name}</h1>
            <p className={styles.circleHost}>Hosted by {circle.host}</p>
          </div>
        </div>

        <p className={styles.circleDescription}>{circle.description}</p>

        <div className={styles.metricsRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Members</span>
            <div className={styles.metricValue}>{circle.members}</div>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Active Chains</span>
            <div className={styles.metricValue}>{circle.activeChains}</div>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Streak</span>
            <div className={styles.metricValue}>{circle.streakDays}d</div>
          </div>
        </div>

        <div className={styles.tagsRow}>
          {circle.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.booksSection}>
          <h2 className={styles.booksTitle}>Books in this Circle</h2>
          {booksLoading ? (
            <div className={styles.loading}>Loading books...</div>
          ) : books.length === 0 ? (
            <div className={styles.empty}>
              <p>No books found in this circle yet.</p>
            </div>
          ) : (
            <div className={styles.booksGrid}>
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onButtonClick={handleBookClick}
                  buttonText="Get This Book"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CircleDetail

