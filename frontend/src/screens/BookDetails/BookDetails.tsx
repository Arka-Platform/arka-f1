import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { booksApi, bookshelfApi, exchangesApi, wishlistApi, type BookResponse } from '../../utils/api'
import Button from '../../components/shared/Button/Button'
import styles from './BookDetails.module.css'

const BookDetails: React.FC = () => {
  const router = useRouter()
  const params = useParams<{ bookId?: string }>()
  const bookId = params?.bookId
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [book, setBook] = useState<BookResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'condition' | 'inside'>('condition')

  const formattedPrice = useMemo(() => {
    const price = book?.price ?? 299
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
  }, [book?.price])

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
      router.push('/login')
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
      router.push('/exchanges/my')
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
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Link href="/browse" className={styles.crumb}>Browse</Link>
          <span className={styles.divider}>/</span>
          <span className={styles.current}>{book.title}</span>
        </div>

        <div className={styles.topGrid}>
          <div className={styles.left}>
            <div className={styles.cover}>
              {book.imageUrl || book.thumbnailUrl ? (
                <img src={book.imageUrl || book.thumbnailUrl || ''} alt={book.title} />
              ) : (
                <div className={styles.coverFallback}>
                  <div className={styles.coverTitle}>{book.title}</div>
                  <div className={styles.coverAuthor}>by {book.author}</div>
                </div>
              )}
            </div>

            <div className={styles.factsCard}>
              <div className={styles.factRow}>
                <div className={styles.factLabel}>Genre</div>
                <div className={styles.factValue}>{book.genre || '—'}</div>
              </div>
              <div className={styles.factRow}>
                <div className={styles.factLabel}>Condition</div>
                <div className={styles.factValue}>Good</div>
              </div>
              <div className={styles.factRow}>
                <div className={styles.factLabel}>ISBN</div>
                <div className={styles.factValueMono}>{book.isbn || '—'}</div>
              </div>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.titleRow}>
              <div className={styles.titleBlock}>
                <h1 className={styles.title}>{book.title}</h1>
                <p className={styles.author}>by {book.author}</p>
              </div>

              <div className={styles.priceBlock}>
                <div className={styles.price}>{formattedPrice}</div>
                <div className={styles.ratingLine}>
                  <span className={styles.star}>★</span>
                  <span className={styles.ratingValue}>{(book.averageRating ?? 4.8).toFixed(1)}</span>
                  <span className={styles.ratingCount}>
                    ({(book.ratingsCount ?? 1240).toLocaleString('en-IN')})
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.tags}>
              <span className={styles.tag}>Popular</span>
              <span className={styles.tag}>Fast shipping</span>
            </div>

            <p className={styles.summary}>{book.description || 'A clean detail layout with calm typography and spacing.'}</p>

            <div className={styles.primaryActions}>
              <Button variant="primary" onClick={handleSwapRequest} disabled={submitting}>
                Get This Book
              </Button>
              <Button variant="secondary" onClick={handleAddWishlist} disabled={submitting}>
                Add to Wishlist
              </Button>
              <Button variant="secondary" onClick={handleAddBookshelf} disabled={submitting}>
                Add to Library
              </Button>
            </div>

            <div className={styles.lowerGrid}>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={activeTab === 'condition' ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab('condition')}
                >
                  Condition
                </button>
                <button
                  type="button"
                  className={activeTab === 'inside' ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab('inside')}
                >
                  Inside the book
                </button>
              </div>

              {activeTab === 'condition' ? (
                <section className={styles.sectionCard}>
                  <h2 className={styles.sectionTitle}>Condition: Worn edges &amp; notes</h2>
                  <p className={styles.sectionBody}>
                    Minimal placeholder content. Replace with real condition notes captured during listing.
                  </p>
                  <ul className={styles.bullets}>
                    <li>Worn edges</li>
                    <li>Light underlining</li>
                    <li>Minor water damage</li>
                  </ul>
                </section>
              ) : (
                <section className={styles.sectionCard}>
                  <h2 className={styles.sectionTitle}>Inside the book</h2>
                  <p className={styles.sectionBody}>
                    Minimal placeholder for sample pages, table of contents, or highlights.
                  </p>
                  <div className={styles.skeleton}>
                    <div className={styles.line} />
                    <div className={styles.line} />
                    <div className={styles.lineShort} />
                    <div className={styles.line} />
                    <div className={styles.lineShort} />
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetails
