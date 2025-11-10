import React from 'react'
import styles from './BookCard.module.css'
import Button from '../Button/Button'

export interface Book {
  id: string
  title: string
  description: string
  price?: string
  image?: string
  author?: string
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
  return (
    <div className={styles.bookCard}>
      <div className={styles.imageContainer}>
        {book.image ? (
          <img src={book.image} alt={book.title} className={styles.image} />
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
        <p className={styles.description}>{book.description}</p>
        {showPrice && book.price && (
          <p className={styles.price}>{book.price}</p>
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


