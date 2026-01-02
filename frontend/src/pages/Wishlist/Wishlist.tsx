import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { wishlistApi, WishlistItemResponse } from '../../utils/api'
import BookCard from '../../components/shared/BookCard/BookCard'
import Button from '../../components/shared/Button/Button'
import styles from './Wishlist.module.css'

const Wishlist: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [wishlist, setWishlist] = useState<WishlistItemResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadWishlist()
    }
  }, [user?.id])

  const loadWishlist = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const data = await wishlistApi.getWishlist(user.id)
      setWishlist(data)
    } catch (err: any) {
      showError(err.message || 'Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (bookId: string) => {
    if (!user?.id) return

    if (!confirm('Remove this book from your wishlist?')) {
      return
    }

    try {
      await wishlistApi.removeFromWishlist(user.id, bookId)
      success('Book removed from wishlist')
      loadWishlist()
    } catch (err: any) {
      showError(err.message || 'Failed to remove from wishlist')
    }
  }

  if (!user) {
    return (
      <div className={styles.wishlist}>
        <div className={styles.authPrompt}>
          <h2>Please log in to view your wishlist</h2>
          <p>Sign in to save books you want to read later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wishlist}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Wishlist</h1>
        <p className={styles.subtitle}>
          {wishlist.length === 0 
            ? 'Your wishlist is empty. Start adding books you want to read!'
            : `${wishlist.length} book${wishlist.length > 1 ? 's' : ''} in your wishlist`
          }
        </p>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading your wishlist...</div>
      ) : wishlist.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
            </svg>
          </div>
          <h2>Your wishlist is empty</h2>
          <p>Start adding books you want to read later!</p>
        </div>
      ) : (
        <div className={styles.wishlistGrid}>
          {wishlist.map((item) => (
            <div key={item.wishlistId} className={styles.wishlistItem}>
              <BookCard
                id={item.bookId}
                title={item.bookTitle}
                author={item.bookAuthor}
                genre={item.bookGenre || undefined}
                price={item.bookPrice}
                imageUrl={item.bookImageUrl || undefined}
                status={item.bookStatus}
                ownerId={item.bookOwnerId}
                ownerName={item.bookOwnerName}
              />
              <div className={styles.itemActions}>
                {item.notes && (
                  <div className={styles.notes}>
                    <strong>Notes:</strong> {item.notes}
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={() => handleRemove(item.bookId)}
                  className={styles.removeButton}
                >
                  Remove from Wishlist
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist


