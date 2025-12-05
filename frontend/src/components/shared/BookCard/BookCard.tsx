import React, { useEffect, useRef } from 'react'
import styles from './BookCard.module.css'
import Button from '../Button/Button'
import { trackBookView } from '../../../utils/tracking'

export interface Book {
  id: string
  title: string
  description: string
  genre?: string
  price?: string | number
  image?: string
  thumbnail?: string
  author?: string
  status?: string
  publisher?: string
  publicationYear?: number
  averageRating?: number
  ratingsCount?: number
}

interface BookCardProps {
  book: Book
  showPrice?: boolean
  showButton?: boolean
  buttonText?: string
  onButtonClick?: (book: Book) => void
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  showPrice = true,
  showButton = true,
  buttonText = 'Buy Now',
  onButtonClick,
}) => {
  const viewStartTime = useRef<number>(Date.now())
  const hasTrackedView = useRef<boolean>(false)
  const coverImage = book.image || book.thumbnail

  // Track view when card is visible for more than 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasTrackedView.current) {
        const duration = Math.floor((Date.now() - viewStartTime.current) / 1000)
        trackBookView(book.id, duration)
        hasTrackedView.current = true
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [book.id])

  const handleCardClick = () => {
    if (!hasTrackedView.current) {
      const duration = Math.floor((Date.now() - viewStartTime.current) / 1000)
      trackBookView(book.id, duration)
      hasTrackedView.current = true
    }
  }

  return (
    <div className={styles.bookCard} onClick={handleCardClick}>
      <div className={styles.imageContainer}>
        {coverImage ? (
          <img src={coverImage} alt={book.title} className={styles.image} />
        ) : (
          <div className={styles.placeholderImage}>
            <svg viewBox="0 0 200 200" className={styles.placeholderSvg}>
              <rect width="200" height="200" fill="currentColor" opacity="0.1" />
              <rect x="50" y="30" width="100" height="140" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{book.title}</h3>
        {book.author && <p className={styles.author}>by {book.author}</p>}
        {book.genre && (
          <span className={styles.genre}>{book.genre}</span>
        )}
        {(book.publisher || book.publicationYear || (book.averageRating && book.averageRating > 0)) && (
          <div className={styles.metaRow}>
            {(book.publisher || book.publicationYear) && (
              <p className={styles.publisher}>
                {book.publisher ?? 'Independent'}
                {book.publicationYear ? ` • ${book.publicationYear}` : ''}
              </p>
            )}
            {book.averageRating && book.averageRating > 0 && (
              <div className={styles.rating}>
                <span>⭐ {book.averageRating.toFixed(1)}</span>
                <span>({book.ratingsCount ?? 0})</span>
              </div>
            )}
          </div>
        )}
        <p className={styles.description}>{book.description}</p>
        {showPrice && book.price && (
          <p className={styles.price}>
            {typeof book.price === 'number' ? `$${book.price.toFixed(2)}` : book.price}
          </p>
        )}
        {showButton && (
          <Button
            onClick={() => onButtonClick?.(book)}
            variant="primary"
            fullWidth
          >
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  )
}

export default BookCard


