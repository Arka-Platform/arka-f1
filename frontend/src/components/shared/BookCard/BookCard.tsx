'use client'

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
  variant?: 'cinematic' | 'row'
  onPick?: (book: Book) => void
  onPass?: (book: Book) => void
  pickLabel?: string
  passLabel?: string
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  showPrice = true,
  showButton = true,
  buttonText = 'Buy Now',
  onButtonClick,
  enableUserCollections = true,
  variant = 'cinematic',
  onPick,
  onPass,
  pickLabel = 'Pick',
  passLabel = 'Pass',
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

  const handlePass = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onPass) {
      onPass(book)
      return
    }
    await handleBookshelfToggle(e)
  }

  const handlePick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onPick) {
      onPick(book)
      return
    }
    onButtonClick?.(book)
  }

  const catalogActive = (book.status ?? '').toUpperCase() === 'AVAILABLE' || !(book.status && book.status.length > 0)
  const primaryLine = isInBookshelf
    ? 'In your library'
    : isInWishlist
      ? 'You requested this'
      : 'No requests yet'

  return (
    <div
      className={`${styles.bookCard} ${variant === 'row' ? styles.rowCard : ''}`}
      onClick={handleCardClick}
    >
      <div className={`${styles.imageContainer} ${variant === 'row' ? styles.rowImageContainer : ''}`}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={book.title}
            className={`${styles.image} ${variant === 'row' ? styles.rowImage : ''}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`${styles.placeholderImage} ${variant === 'row' ? styles.rowPlaceholder : ''}`}>
            <svg viewBox="0 0 200 200" className={styles.placeholderSvg}>
              <rect width="200" height="200" fill="currentColor" opacity="0.1" />
              <rect x="50" y="30" width="100" height="140" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
        )}

        {variant !== 'row' && (
          <>
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
          </>
        )}
      </div>
      <div className={`${styles.content} ${variant === 'row' ? styles.rowContent : ''}`}>
        <div className={`${styles.rowMain} ${variant === 'row' ? styles.rowMainOn : ''}`}>
          <div className={styles.rowText}>
            <h3 className={`${styles.title} ${variant === 'row' ? styles.rowTitle : ''}`}>{book.title}</h3>
            {book.author && <p className={`${styles.author} ${variant === 'row' ? styles.rowAuthor : ''}`}>{book.author}</p>}

            {variant === 'row' ? (
              <>
                <p className={styles.rowPrimaryLine}>{primaryLine}</p>
                <p className={styles.rowSecondaryLine}>{catalogActive ? 'Active in catalog' : 'Inactive in catalog'}</p>
              </>
            ) : (
              <>
                {book.genre && <span className={styles.genre}>{book.genre}</span>}
                {(book.publisher || book.publicationYear) && (
                  <div className={styles.metaRow}>
                    <p className={styles.publisher}>
                      {book.publisher ?? 'Independent'}
                      {book.publicationYear ? ` • ${book.publicationYear}` : ''}
                    </p>
                  </div>
                )}
                <p className={styles.description}>{book.description}</p>
                <div className={styles.priceRow}>
                  {showPrice && book.price && (
                    <p className={styles.price}>
                      {typeof book.price === 'number' ? `₹${book.price.toFixed(0)}` : book.price}
                    </p>
                  )}
                  {book.averageRating && book.averageRating > 0 && (
                    <span className={styles.ratingBadge} title="Average rating">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {book.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
                {book.ratingsCount != null && book.ratingsCount > 0 && (
                  <p className={styles.socialProof}>{book.ratingsCount} readers engaged</p>
                )}
                {showButton && (
                  <Button
                    onClick={() => onButtonClick?.(book)}
                    variant="primary"
                    fullWidth
                    className={styles.ctaButton}
                  >
                    {buttonText}
                  </Button>
                )}
              </>
            )}
          </div>

          {variant === 'row' && (
            <div className={styles.rowActions}>
              <button
                type="button"
                className={`${styles.rowActionBtn} ${styles.rowPassBtn} ${isInBookshelf ? styles.rowActionSelected : ''}`}
                onClick={handlePass}
                aria-label={isInBookshelf ? 'Passed (in your library)' : 'Pass this book'}
              >
                {isInBookshelf ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                )}
                <span>{passLabel}</span>
              </button>
              <button
                type="button"
                className={`${styles.rowActionBtn} ${styles.rowPickBtn}`}
                onClick={handlePick}
                aria-label="Pick this book"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M12 20l9-5-9-5-9 5 9 5z" />
                  <path d="M12 12l9-5-9-5-9 5 9 5z" opacity="0.35" />
                </svg>
                <span>{pickLabel}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookCard


