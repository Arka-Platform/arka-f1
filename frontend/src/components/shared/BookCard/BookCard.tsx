import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { wishlistApi, bookshelfApi } from '../../../utils/api'
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
  enableUserCollections?: boolean
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  showPrice = true,
  showButton = true,
  buttonText = 'Buy Now',
  onButtonClick,
  enableUserCollections = true,
}) => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const viewStartTime = useRef<number>(Date.now())
  const hasTrackedView = useRef<boolean>(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isInBookshelf, setIsInBookshelf] = useState(false)
  const [isTogglingBookshelf, setIsTogglingBookshelf] = useState(false)
  const coverImage = book.image || book.thumbnail

  // Check if book is in wishlist
  useEffect(() => {
    if (!enableUserCollections) return
    const checkWishlistStatus = async () => {
      if (user?.id && book.id) {
        try {
          const response = await wishlistApi.checkInWishlist(user.id, book.id)
          setIsInWishlist(response.isInWishlist)
        } catch (error) {
          // Silently fail - wishlist check is optional
          console.error('Error checking wishlist status:', error)
        }
      }
    }
    checkWishlistStatus()
  }, [user?.id, book.id, enableUserCollections])

  // Check if book is in bookshelf
  useEffect(() => {
    if (!enableUserCollections) return
    const checkBookshelfStatus = async () => {
      if (user?.id && book.id) {
        try {
          const response = await bookshelfApi.checkInBookshelf(user.id, book.id)
          setIsInBookshelf(response.isInBookshelf)
        } catch (error) {
          // Silently fail - bookshelf check is optional
          console.error('Error checking bookshelf status:', error)
        }
      }
    }
    checkBookshelfStatus()
  }, [user?.id, book.id, enableUserCollections])

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

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    if (!user?.id) {
      showError('Please log in to add books to your wishlist')
      return
    }

    if (isToggling) return // Prevent double clicks

    setIsToggling(true)
    
    try {
      if (isInWishlist) {
        await wishlistApi.removeFromWishlist(user.id, book.id)
        setIsInWishlist(false)
        success('Removed from wishlist')
      } else {
        await wishlistApi.addToWishlist(user.id, book.id)
        setIsInWishlist(true)
        success('Added to wishlist')
      }
      
      // Trigger a custom event to update wishlist count in header
      window.dispatchEvent(new CustomEvent('wishlistUpdated'))
    } catch (err: any) {
      showError(err.message || 'Failed to update wishlist')
    } finally {
      setIsToggling(false)
    }
  }

  const handleBookshelfToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    if (!user?.id) {
      showError('Please log in to add books to your bookshelf')
      return
    }

    if (isTogglingBookshelf) return // Prevent double clicks

    setIsTogglingBookshelf(true)
    
    try {
      if (isInBookshelf) {
        await bookshelfApi.removeFromBookshelf(user.id, book.id)
        setIsInBookshelf(false)
        success('Removed from bookshelf')
      } else {
        await bookshelfApi.addToBookshelf(user.id, book.id)
        setIsInBookshelf(true)
        success('Added to bookshelf')
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update bookshelf')
    } finally {
      setIsTogglingBookshelf(false)
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
        {/* Wishlist Heart Icon */}
        {user && enableUserCollections && (
          <button
            className={`${styles.wishlistButton} ${isInWishlist ? styles.wishlistButtonActive : ''} ${isToggling ? styles.wishlistButtonAnimating : ''}`}
            onClick={handleWishlistToggle}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isInWishlist ? '#ff6b6b' : 'none'}
              stroke={isInWishlist ? '#ff6b6b' : 'currentColor'}
              strokeWidth="2"
              className={styles.heartIcon}
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
            </svg>
          </button>
        )}
        {/* Bookshelf Book Icon */}
        {user && enableUserCollections && (
          <button
            className={`${styles.bookshelfButton} ${isInBookshelf ? styles.bookshelfButtonActive : ''} ${isTogglingBookshelf ? styles.bookshelfButtonAnimating : ''}`}
            onClick={handleBookshelfToggle}
            aria-label={isInBookshelf ? 'Remove from bookshelf' : 'Add to bookshelf'}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isInBookshelf ? '#4CAF50' : 'none'}
              stroke={isInBookshelf ? '#4CAF50' : 'currentColor'}
              strokeWidth="2"
              className={styles.bookIcon}
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </button>
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
            {typeof book.price === 'number' ? `₹${book.price.toFixed(2)}` : book.price}
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


