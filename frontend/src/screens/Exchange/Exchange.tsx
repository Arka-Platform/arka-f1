import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { booksApi, exchangesApi, BookResponse } from '../../utils/api'
import BookCard, { Book } from '../../components/shared/BookCard/BookCard'
import Input from '../../components/shared/Input/Input'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import styles from './Exchange.module.css'

const genres = [
  { value: '', label: 'All Genres' },
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Science Fiction', label: 'Science Fiction' },
  { value: 'Mystery', label: 'Mystery' },
  { value: 'Thriller', label: 'Thriller' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'Biography', label: 'Biography' },
  { value: 'Fantasy', label: 'Fantasy' },
  { value: 'Romance', label: 'Romance' },
]

const Exchange: React.FC = () => {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangingBookId, setExchangingBookId] = useState<string | null>(null)
  const [feeInfo, setFeeInfo] = useState<{ bookPrice: number; serviceFee: number; totalCost: number } | null>(null)

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

  useEffect(() => {
    loadBooks()
  }, [searchQuery, selectedGenre])

  const loadBooks = async () => {
    try {
      setLoading(true)
      const params: { search?: string; genre?: string } = {}
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      } else if (selectedGenre) {
        params.genre = selectedGenre
      }
      
      const data = await booksApi.list(params)
      // Filter to show only available books
      const availableBooks = data.filter(book => book.status === 'PUBLISHED')
      setBooks(availableBooks.map(bookToCard))
    } catch (err) {
      showError('Failed to load books')
      console.error('Error loading books:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateFee = async (bookPrice: number) => {
    try {
      const fee = await exchangesApi.calculateFee(bookPrice)
      setFeeInfo({
        bookPrice: fee.bookPrice,
        serviceFee: fee.serviceFee,
        totalCost: fee.totalCost,
      })
    } catch (err) {
      showError('Failed to calculate fee')
      console.error('Error calculating fee:', err)
    }
  }

  const handleExchangeRequest = async (bookId: string) => {
    if (!user?.id) {
      showError('Please login to request an exchange')
      router.push('/login')
      return
    }

    try {
      setExchangingBookId(bookId)
      await exchangesApi.create({ bookId }, user.id)
      success('Exchange recorded successfully!')
      router.push('/exchanges/my')
    } catch (err: any) {
      showError(err.message || 'Failed to create exchange request')
      console.error('Error creating exchange:', err)
    } finally {
      setExchangingBookId(null)
    }
  }

  const handleBookClick = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (book && book.price) {
      handleCalculateFee(Number(book.price))
    }
  }

  return (
    <div className={styles.exchange}>
      <div className={styles.header}>
        <h1 className={styles.title}>Exchange Books</h1>
        <p className={styles.subtitle}>
          Browse available books and request an exchange. Offer your book in return for the one you want.
        </p>
      </div>

      <div className={styles.filters}>
        <Input
          type="text"
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <Select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className={styles.genreSelect}
        >
          {genres.map((genre) => (
            <option key={genre.value} value={genre.value}>
              {genre.label}
            </option>
          ))}
        </Select>
        <Button
          variant="secondary"
          onClick={() => router.push('/exchanges/my')}
          className={styles.myExchangesButton}
        >
          My Exchanges
        </Button>
      </div>

      {feeInfo && (
        <div className={styles.feeInfo}>
          <h3>Exchange Fee Breakdown</h3>
          <div className={styles.feeDetails}>
            <div className={styles.feeRow}>
              <span>Book Price:</span>
              <span>₹{feeInfo.bookPrice.toFixed(2)}</span>
            </div>
            <div className={styles.feeRow}>
              <span>Service Fee (10%):</span>
              <span>₹{feeInfo.serviceFee.toFixed(2)}</span>
            </div>
            <div className={styles.feeRowTotal}>
              <span>Total Cost:</span>
              <span>₹{feeInfo.totalCost.toFixed(2)}</span>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setFeeInfo(null)}
            className={styles.closeFeeButton}
          >
            Close
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading books...</div>
      ) : books.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No books available for exchange at the moment.</p>
          <Button variant="primary" onClick={() => router.push('/books')}>
            Browse All Books
          </Button>
        </div>
      ) : (
        <div className={styles.booksGrid}>
          {books.map((book) => (
            <div key={book.id} className={styles.bookWrapper}>
              <BookCard
                book={book}
                showButton
                buttonText="Calculate Fee"
                onButtonClick={() => handleBookClick(book.id)}
              />
              <div className={styles.exchangeActions}>
                {book.price && (
                  <Button
                    variant="primary"
                    onClick={() => handleExchangeRequest(book.id)}
                    disabled={exchangingBookId === book.id}
                    className={styles.exchangeButton}
                  >
                    {exchangingBookId === book.id ? 'Requesting...' : 'Request Exchange'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Exchange

