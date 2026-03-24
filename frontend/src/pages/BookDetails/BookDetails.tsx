import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { booksApi, bookshelfApi, exchangesApi, wishlistApi, type BookResponse } from '../../utils/api'
import Button from '../../components/shared/Button/Button'
import styles from './BookDetails.module.css'

const BookDetails: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [book, setBook] = useState<BookResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) return
      try {
        setLoading(true)
        const data = await booksApi.getById(bookId)
        setBook(data)
      } catch (err: any) {
        showError(err.message || 'Failed to load book details')
      } finally {
        setLoading(false)
      }
    }
    loadBook()
  }, [bookId])

  const requireAuth = () => {
    if (!user?.id) {
      showError('Please log in to continue')
      navigate('/login')
      return false
    }
    return true
  }

  const handleAddWishlist = async () => {
    if (!book || !requireAuth()) return
    try {
      setSubmitting(true)
      await wishlistApi.addToWishlist(user!.id, book.id)
      success('Added to wishlist')
    } catch (err: any) {
      showError(err.message || 'Failed to add to wishlist')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddBookshelf = async () => {
    if (!book || !requireAuth()) return
    try {
      setSubmitting(true)
      await bookshelfApi.addToBookshelf(user!.id, book.id)
      success('Added to my library')
    } catch (err: any) {
      showError(err.message || 'Failed to add to library')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSwapRequest = async () => {
    if (!book || !requireAuth()) return
    try {
      setSubmitting(true)
      await exchangesApi.create({ bookId: book.id }, user!.id)
      success('Swap request sent successfully')
      navigate('/exchanges/my')
    } catch (err: any) {
      showError(err.message || 'Failed to send swap request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className={styles.wrapper}><div className={styles.card}>Loading book details...</div></div>
  }

  if (!book) {
    return <div className={styles.wrapper}><div className={styles.card}>Book not found.</div></div>
  }

  return (
    <div className={`${styles.wrapper} vibePage`}>
      <div className="vibeContainer">
        <div className="vibeQuickLinks">
          <Link to="/home" className="vibeQuickLink">Home</Link>
          <Link to="/books" className="vibeQuickLink">Nearby Finds</Link>
          <Link to="/exchange" className="vibeQuickLink">Swap Books</Link>
          <Link to="/wishlist" className="vibeQuickLink">Wishlist</Link>
          <Link to="/bookshelf" className="vibeQuickLink">My Library</Link>
        </div>
        <div className={styles.card}>
          <div className={styles.media}>
            {book.imageUrl || book.thumbnailUrl ? (
              <img src={book.imageUrl || book.thumbnailUrl || ''} alt={book.title} />
            ) : (
              <div className={styles.placeholder}>No Cover</div>
            )}
          </div>
          <div className={styles.content}>
            <h1>{book.title}</h1>
            <p className={styles.meta}>by {book.author}</p>
            {book.genre && <p className={styles.meta}>Genre: {book.genre}</p>}
            {book.publisher && <p className={styles.meta}>Publisher: {book.publisher}</p>}
            {book.publicationYear && <p className={styles.meta}>Year: {book.publicationYear}</p>}
            <p className={styles.description}>{book.description || 'No description available.'}</p>
            <div className={styles.actions}>
              <Button variant="primary" onClick={handleSwapRequest} disabled={submitting}>Request Swap</Button>
              <Button variant="secondary" onClick={handleAddWishlist} disabled={submitting}>Add to Wishlist</Button>
              <Button variant="secondary" onClick={handleAddBookshelf} disabled={submitting}>Add to Library</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetails
