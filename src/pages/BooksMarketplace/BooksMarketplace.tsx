import React, { useState } from 'react'
import BookCard, { Book } from '../../components/shared/BookCard/BookCard'
import Input from '../../components/shared/Input/Input'
import Select from '../../components/shared/Select/Select'
import styles from './BooksMarketplace.module.css'

const BooksMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [priceRange, setPriceRange] = useState('')

  const books: Book[] = [
    {
      id: '1',
      title: 'The Great Gatsby',
      description: 'A classic novel by F. Scott Fitzgerald.',
      price: '$15.00',
    },
    {
      id: '2',
      title: 'Calculus: Early Transcendentals',
      description: 'Comprehensive calculus textbook by James Stewart.',
      price: '$40.00',
    },
    {
      id: '3',
      title: 'The Very Hungry Caterpillar',
      description: 'A beloved children\'s book by Eric Carle.',
      price: '$10.00',
    },
  ]

  const recommendedBooks: Book[] = [
    {
      id: '4',
      title: 'Gone Girl',
      description: 'A thriller novel by Gillian Flynn.',
    },
    {
      id: '5',
      title: 'Atomic Habits',
      description: 'A self-help book by James Clear.',
    },
    {
      id: '6',
      title: 'The Joy of Cooking',
      description: 'A comprehensive cookbook by Irma S. Rombauer.',
    },
  ]

  const reviews = [
    { text: 'Great selection of books and user-friendly interface!', author: 'Sarah L.' },
    { text: 'I found rare books at an amazing price here. Highly recommend!', author: 'John D.' },
  ]

  const handleBookClick = (book: Book) => {
    console.log('Book clicked:', book)
  }

  return (
    <div className={styles.marketplace}>
      {/* Search and Filters */}
      <section className={styles.searchSection}>
        <div className={styles.container}>
          <div className={styles.searchBar}>
            <Input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
            <div className={styles.filters}>
              <Select
                options={[
                  { value: '', label: 'Category' },
                  { value: 'fiction', label: 'Fiction' },
                  { value: 'non-fiction', label: 'Non-Fiction' },
                  { value: 'textbook', label: 'Textbook' },
                ]}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Select
                options={[
                  { value: '', label: 'Condition' },
                  { value: 'new', label: 'New' },
                  { value: 'like-new', label: 'Like New' },
                  { value: 'good', label: 'Good' },
                ]}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
              <Select
                options={[
                  { value: '', label: 'Price Range' },
                  { value: '0-10', label: '$0 - $10' },
                  { value: '10-25', label: '$10 - $25' },
                  { value: '25-50', label: '$25 - $50' },
                ]}
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Book Listings */}
      <section className={styles.listingsSection}>
        <div className={styles.container}>
          <div className={styles.booksGrid}>
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onButtonClick={handleBookClick}
              />
            ))}
          </div>
        </div>
      </section>

      {/* User Reviews */}
      <section className={styles.reviewsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>User Reviews</h2>
          <div className={styles.reviewsGrid}>
            {reviews.map((review, index) => (
              <div key={index} className={styles.reviewCard}>
                <p className={styles.reviewText}>"{review.text}"</p>
                <p className={styles.reviewAuthor}>- {review.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className={styles.recommendedSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Recommended for You</h2>
          <div className={styles.booksGrid}>
            {recommendedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showPrice={false}
                showButton={false}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default BooksMarketplace


