import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { bookshelfApi, BookshelfItemResponse } from '../../utils/api'
import styles from './Bookshelf.module.css'
import Button from '../../components/shared/Button/Button'
import Link from 'next/link'

const Bookshelf: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [bookshelf, setBookshelf] = useState<BookshelfItemResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadBookshelf()
    } else {
      setLoading(false)
      setBookshelf([])
    }
  }, [user?.id])

  const loadBookshelf = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const data = await bookshelfApi.getBookshelf(user.id)
      setBookshelf(data)
    } catch (err: any) {
      showError(err.message || 'Failed to load bookshelf')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromBookshelf = async (bookId: string) => {
    if (!user?.id) return
    if (!confirm('Are you sure you want to remove this book from your bookshelf?')) {
      return
    }
    try {
      await bookshelfApi.removeFromBookshelf(user.id, bookId)
      success('Book removed from bookshelf!')
      loadBookshelf()
    } catch (err: any) {
      showError(err.message || 'Failed to remove book from bookshelf')
    }
  }

  if (!user) {
    return (
      <div className={styles.bookshelf}>
        <div className={styles.authPrompt}>
          <p>Please log in to view your bookshelf.</p>
          <Link href="/login" className={styles.loginButton}>Log In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.bookshelf}>
      <h1 className={styles.pageTitle}>My Bookshelf</h1>
      <p className={styles.pageDescription}>
        Books you own and have at home
      </p>
      {loading ? (
        <p className={styles.loading}>Loading bookshelf...</p>
      ) : bookshelf.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p>Your bookshelf is empty. Start adding books you own!</p>
          <Link href="/exchange" className={styles.browseButton}>Browse books</Link>
        </div>
      ) : (
        <BookshelfByGenre
          items={bookshelf}
          onRemove={(bookId) => void handleRemoveFromBookshelf(bookId)}
        />
      )}
    </div>
  )
}

export default Bookshelf

function normalizeGenre(g: string | null | undefined): string {
  const v = (g ?? '').trim()
  return v.length ? v : 'Uncategorized'
}

function BookshelfByGenre({ items, onRemove }: { items: BookshelfItemResponse[]; onRemove: (bookId: string) => void }) {
  const sections = useMemo(() => {
    const map = new Map<string, BookshelfItemResponse[]>()
    for (const item of items) {
      const genre = normalizeGenre(item.bookGenre)
      const arr = map.get(genre)
      if (arr) arr.push(item)
      else map.set(genre, [item])
    }
    const out = Array.from(map.entries()).map(([genre, list]) => ({ genre, list }))
    out.sort((a, b) => a.genre.localeCompare(b.genre))
    return out
  }, [items])

  return (
    <div className={styles.genreSections}>
      {sections.map(({ genre, list }) => (
        <section key={genre} className={styles.genreSection} aria-label={genre}>
          <div className={styles.genreHeader}>
            <h2 className={styles.genreTitle}>{genre}</h2>
            <div className={styles.genreCount}>{list.length}</div>
          </div>
          <div className={styles.genreRow} role="list">
            {list.map((item) => (
              <div key={item.id} className={styles.bookshelfItem} role="listitem">
                <div className={styles.bookImageWrapper} role="presentation">
                  <img
                    src={item.bookImageUrl || '/images/default-book.png'}
                    alt={item.bookTitle}
                    className={styles.bookImage}
                    loading="lazy"
                  />
                </div>
                <div className={styles.bookDetails}>
                  <div className={styles.bookTitle}>{item.bookTitle}</div>
                  <p className={styles.bookAuthor}>{item.bookAuthor}</p>
                  {item.notes && <p className={styles.bookNotes}>{item.notes}</p>}
                  <p className={styles.bookPrice}>₹{item.bookPrice.toFixed(2)}</p>
                  <Button variant="secondary" onClick={() => onRemove(item.bookId)} small>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}


