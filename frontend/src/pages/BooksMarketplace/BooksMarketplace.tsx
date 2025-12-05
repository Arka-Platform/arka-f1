import React, { useState, useEffect } from 'react'
import BookCard, { Book } from '../../components/shared/BookCard/BookCard'
import Input from '../../components/shared/Input/Input'
import Select from '../../components/shared/Select/Select'
import RecommendationSection from '../../components/shared/RecommendationSection/RecommendationSection'
import { useCart } from '../../contexts/CartContext'
import { booksApi, BookResponse } from '../../utils/api'
import { trackSearch, trackBookView, trackCartAdd } from '../../utils/tracking'
import styles from './BooksMarketplace.module.css'

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
  { value: 'Horror', label: 'Horror' },
  { value: 'Historical Fiction', label: 'Historical Fiction' },
]

const BooksMarketplace: React.FC = () => {
  const { addToCart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const fetchBooks = async () => {
      try {
        setLoading(true)
        setError(null)
        const params: { search?: string; genre?: string } = {}
        
        if (searchQuery.trim()) {
          params.search = searchQuery.trim()
        } else if (selectedGenre) {
          params.genre = selectedGenre
        }
        
        const data = await booksApi.list(params)
        setBooks(data.map(bookToCard))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load books')
        console.error('Error fetching books:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [searchQuery, selectedGenre])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim()) {
      trackSearch(query, selectedGenre)
    }
  }

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(e.target.value)
    setSearchQuery('') // Clear search when filtering by genre
  }

  const handleBookClick = (book: Book) => {
    trackBookView(book.id, 0)
    trackCartAdd(book.id)
    addToCart(book)
  }

  return (
    <div className={styles.marketplace}>
      {/* Search and Filters */}
      <section className={styles.searchSection}>
        <div className={styles.container}>
          <div className={styles.searchBar}>
            <Input
              type="text"
              placeholder="Search books by title, author, genre, or description..."
              value={searchQuery}
              onChange={handleSearchChange}
              fullWidth
            />
            <div className={styles.filters}>
              <Select
                options={genres}
                value={selectedGenre}
                onChange={handleGenreChange}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section - Show when no search/filter */}
      {!searchQuery && !selectedGenre && !loading && (
        <>
          <RecommendationSection
            title="Recommended for You"
            type="personalized"
            limit={8}
            showViewAll
          />
          <RecommendationSection
            title="Popular Books"
            type="popular"
            limit={8}
            showViewAll
          />
        </>
      )}

      {/* Book Listings */}
      <section className={styles.listingsSection}>
        <div className={styles.container}>
          {loading && (
            <div className={styles.loading}>
              <p>Loading books...</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && books.length === 0 && (
            <div className={styles.empty}>
              <p>No books found. Try adjusting your search or filters.</p>
            </div>
          )}
          
          {!loading && !error && books.length > 0 && (
            <>
              <div className={styles.resultsInfo}>
                <p>Found {books.length} book{books.length !== 1 ? 's' : ''}</p>
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
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default BooksMarketplace
