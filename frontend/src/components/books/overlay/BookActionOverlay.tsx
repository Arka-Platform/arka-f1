'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { useCart } from '../../../contexts/CartContext'
import { bookshelfApi, wishlistApi, type BookResponse } from '../../../utils/api'
import type { Book } from '../../../types/book'
import styles from './BooksOverlay.module.css'

import BookLayoutAnchor from './BookLayoutAnchor'

export type BookActionOverlayProps = {
  activeBook: BookResponse | null
  layoutId: string
  onSelectDetail?: (bookId: string) => void
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7.1-4.7-9.4-8.5C.2 8.6 2.1 5.5 5.3 5.1c1.7-.2 3.3.6 4.3 1.8 1-1.2 2.6-2 4.3-1.8 3.2.4 5.1 3.5 2.7 7.4C19.1 16.3 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 7h14l-1.3 7.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L5.7 3.8H3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7.2 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function HandIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 11V7.5a1.5 1.5 0 0 1 3 0V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M11 11V6.5a1.5 1.5 0 0 1 3 0V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14 11V8a1.5 1.5 0 0 1 3 0v7c0 3-2 5-5 5H11c-2.2 0-4-1.8-4-4v-2a2 2 0 0 1 2-2h1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 9l-4-2-4 2 4 2 4-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M18.5 6.5l1.5 4.5-5 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 6.5l-1.5 4.5 5 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="2" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export default function BookActionOverlay({ activeBook, layoutId, onSelectDetail }: BookActionOverlayProps) {
  const { user } = useAuth()
  const { success, error } = useToast()
  const { addToCart } = useCart()

  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isInBookshelf, setIsInBookshelf] = useState(false)
  const [isToggling, setIsToggling] = useState<'wishlist' | 'bookshelf' | null>(null)

  const cardBook: Book | null = useMemo(() => {
    if (!activeBook) return null
    return {
      id: activeBook.id,
      title: activeBook.title,
      author: activeBook.author,
      description: activeBook.description,
      genre: activeBook.genre ?? undefined,
      price: activeBook.price ?? undefined,
      status: activeBook.status,
      image: activeBook.imageUrl ?? activeBook.thumbnailUrl ?? undefined,
      thumbnail: activeBook.thumbnailUrl ?? activeBook.imageUrl ?? undefined,
      publisher: activeBook.publisher ?? undefined,
      publicationYear: activeBook.publicationYear ?? undefined,
      averageRating: activeBook.averageRating ?? undefined,
      ratingsCount: activeBook.ratingsCount ?? undefined,
    }
  }, [activeBook])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!mounted) return
      if (!activeBook || !user?.id) {
        setIsInWishlist(false)
        setIsInBookshelf(false)
        return
      }
      try {
        const [wishlistRes, bookshelfRes] = await Promise.all([
          wishlistApi.checkInWishlist(user.id, activeBook.id),
          bookshelfApi.checkInBookshelf(user.id, activeBook.id),
        ])
        if (!mounted) return
        setIsInWishlist(!!wishlistRes.isInWishlist)
        setIsInBookshelf(!!bookshelfRes.isInBookshelf)
      } catch (e) {
        // Optional state; don't block UI.
        console.error(e)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [activeBook?.id, user?.id])

  const handleCart = useCallback(() => {
    if (!activeBook || !cardBook) return
    addToCart(cardBook)
    success('Added to cart')
  }, [activeBook, addToCart, cardBook, success])

  const handleToggleWishlist = useCallback(async () => {
    if (!activeBook) return
    if (!user?.id) {
      error('Please log in to add books to your wishlist')
      return
    }
    if (isToggling) return
    setIsToggling('wishlist')
    try {
      if (isInWishlist) {
        await wishlistApi.removeFromWishlist(user.id, activeBook.id)
        setIsInWishlist(false)
        success('Removed from wishlist')
      } else {
        await wishlistApi.addToWishlist(user.id, activeBook.id)
        setIsInWishlist(true)
        success('Added to wishlist')
      }
    } catch (e: any) {
      error(e?.message || 'Failed to update wishlist')
    } finally {
      setIsToggling(null)
    }
  }, [activeBook, error, isInWishlist, isToggling, success, user?.id])

  const handleToggleBookshelf = useCallback(async () => {
    if (!activeBook) return
    if (!user?.id) {
      error('Please log in to add books to your bookshelf')
      return
    }
    if (isToggling) return
    setIsToggling('bookshelf')
    try {
      if (isInBookshelf) {
        await bookshelfApi.removeFromBookshelf(user.id, activeBook.id)
        setIsInBookshelf(false)
        success('Removed from bookshelf')
      } else {
        await bookshelfApi.addToBookshelf(user.id, activeBook.id)
        setIsInBookshelf(true)
        success('Added to bookshelf')
      }
    } catch (e: any) {
      error(e?.message || 'Failed to update bookshelf')
    } finally {
      setIsToggling(null)
    }
  }, [activeBook, error, isInBookshelf, isToggling, success, user?.id])

  const handleShare = useCallback(async () => {
    if (!activeBook) return
    const url = `${window.location.origin}/home`
    try {
      if (navigator.share) {
        await navigator.share({ url, title: activeBook.title })
        return
      }
    } catch {
      // Fall back to clipboard.
    }
    try {
      await navigator.clipboard.writeText(url)
      success('Link copied')
    } catch {
      error('Unable to share link')
    }
  }, [activeBook, error, success])

  return (
    <div className={styles.overlayRoot} aria-hidden={false}>
      <div className={styles.anchor}>
        <AnimatePresence mode="wait">
          {activeBook ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
              <BookLayoutAnchor
                book={activeBook}
                layoutId={layoutId}
                onClick={onSelectDetail ? () => onSelectDetail(activeBook.id) : undefined}
                subtitle={activeBook.price != null ? `₹${activeBook.price}` : 'Book'}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <motion.div
        className={styles.toolbar}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: activeBook ? 1 : 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{ pointerEvents: activeBook ? 'auto' : 'none' }}
      >
        <motion.button
          type="button"
          className={styles.pillButton}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCart}
          disabled={!activeBook || !cardBook}
          style={{ opacity: activeBook ? 1 : 0.7 }}
        >
          <CartIcon />
          <div className={styles.pillText}>
            <div className={styles.pillTitle}>Add to cart</div>
            <div className={styles.pillSubtitle}>{activeBook?.price != null ? `₹${activeBook.price}` : 'Add to cart'}</div>
          </div>
        </motion.button>

        <motion.button
          type="button"
          className={styles.iconButton}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Wishlist"
          onClick={handleToggleWishlist}
          disabled={!activeBook || !user?.id || isToggling === 'wishlist'}
          style={{ opacity: activeBook ? 1 : 0.65 }}
        >
          <HeartIcon filled={isInWishlist} />
        </motion.button>

        <motion.button
          type="button"
          className={styles.iconButton}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          aria-label="I have it"
          onClick={handleToggleBookshelf}
          disabled={!activeBook || !user?.id || isToggling === 'bookshelf'}
          style={{ opacity: activeBook ? 1 : 0.65 }}
        >
          <HandIcon />
        </motion.button>

        <motion.button
          type="button"
          className={styles.iconButton}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Share"
          onClick={handleShare}
          disabled={!activeBook}
          style={{ opacity: activeBook ? 1 : 0.65 }}
        >
          <ShareIcon />
        </motion.button>
      </motion.div>
    </div>
  )
}

