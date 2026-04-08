'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { useCart } from '../../../contexts/CartContext'
import { bookshelfApi, wishlistApi, type ListingResponse } from '../../../utils/api'
import type { Book } from '../../../types/book'
import styles from './BooksOverlay.module.css'

import ListingLayoutAnchor from './ListingLayoutAnchor'

export type ListingActionOverlayProps = {
  activeListing: ListingResponse | null
  layoutId: string
  onSelectDetail?: (listingId: string) => void
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
      <path d="M9.2 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7.2 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
    </svg>
  )
}

function HandIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 11V7.5a1.5 1.5 0 0 1 3 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11 11V6.5a1.5 1.5 0 0 1 3 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
      <path d="M14 9l-4-2-4 2 4 2 4-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 11v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18.5 6.5l1.5 4.5-5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 6.5l-1.5 4.5 5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="2" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export default function ListingActionOverlay({ activeListing, layoutId, onSelectDetail }: ListingActionOverlayProps) {
  const { user } = useAuth()
  const { success, error } = useToast()
  const { addToCart } = useCart()

  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isInBookshelf, setIsInBookshelf] = useState(false)
  const [isToggling, setIsToggling] = useState<'wishlist' | 'bookshelf' | null>(null)

  const cardBook: Book | null = useMemo(() => {
    if (!activeListing) return null
    return {
      id: activeListing.bookId,
      title: activeListing.title,
      author: activeListing.author,
      description: activeListing.description,
      genre: activeListing.genre ?? undefined,
      price: activeListing.price,
      status: 'AVAILABLE',
      image: activeListing.coverUrl ?? undefined,
      thumbnail: activeListing.coverUrl ?? undefined,
    }
  }, [activeListing])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!mounted) return
      if (!activeListing || !user?.id) {
        setIsInWishlist(false)
        setIsInBookshelf(false)
        return
      }
      const [wishlistRes, bookshelfRes] = await Promise.all([
        wishlistApi.checkInWishlist(user.id, activeListing.bookId),
        bookshelfApi.checkInBookshelf(user.id, activeListing.bookId),
      ])
      if (!mounted) return
      setIsInWishlist(!!wishlistRes.isInWishlist)
      setIsInBookshelf(!!bookshelfRes.isInBookshelf)
    }
    run()
    return () => {
      mounted = false
    }
  }, [activeListing?.bookId, user?.id])

  const handleCart = useCallback(() => {
    if (!activeListing || !cardBook) return
    addToCart(cardBook)
    success('Added to cart')
  }, [activeListing, addToCart, cardBook, success])

  const handleToggleWishlist = useCallback(async () => {
    if (!activeListing) return
    if (!user?.id) throw new Error('Not authenticated')
    if (isToggling) return
    setIsToggling('wishlist')
    try {
      if (isInWishlist) {
        await wishlistApi.removeFromWishlist(user.id, activeListing.bookId)
        setIsInWishlist(false)
        success('Removed from wishlist')
      } else {
        await wishlistApi.addToWishlist(user.id, activeListing.bookId)
        setIsInWishlist(true)
        success('Added to wishlist')
      }
    } catch (e: any) {
      error(e?.message || 'Failed to update wishlist')
    } finally {
      setIsToggling(null)
    }
  }, [activeListing, error, isInWishlist, isToggling, success, user?.id])

  const handleToggleBookshelf = useCallback(async () => {
    if (!activeListing) return
    if (!user?.id) throw new Error('Not authenticated')
    if (isToggling) return
    setIsToggling('bookshelf')
    try {
      if (isInBookshelf) {
        await bookshelfApi.removeFromBookshelf(user.id, activeListing.bookId)
        setIsInBookshelf(false)
        success('Removed from bookshelf')
      } else {
        await bookshelfApi.addToBookshelf(user.id, activeListing.bookId)
        setIsInBookshelf(true)
        success('Added to bookshelf')
      }
    } catch (e: any) {
      error(e?.message || 'Failed to update bookshelf')
    } finally {
      setIsToggling(null)
    }
  }, [activeListing, error, isInBookshelf, isToggling, success, user?.id])

  const handleShare = useCallback(async () => {
    if (!activeListing) return
    const url = `${window.location.origin}/exchange?search=${encodeURIComponent(activeListing.title)}`
    if (navigator.share) {
      await navigator.share({ url, title: activeListing.title })
      return
    }
    await navigator.clipboard.writeText(url)
    success('Link copied')
  }, [activeListing, success])

  return (
    <div className={styles.overlayRoot} aria-hidden={false}>
      <div className={styles.anchor}>
        <AnimatePresence mode="wait">
          {activeListing ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
              <ListingLayoutAnchor
                listing={activeListing}
                layoutId={layoutId}
                onClick={onSelectDetail ? () => onSelectDetail(activeListing.listingId) : undefined}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <motion.div
        className={styles.toolbar}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: activeListing ? 1 : 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{ pointerEvents: activeListing ? 'auto' : 'none' }}
      >
        <motion.button type="button" className={styles.pillButton} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={handleCart}>
          <CartIcon />
          <div className={styles.pillText}>
            <div className={styles.pillTitle}>Add to cart</div>
            <div className={styles.pillSubtitle}>{activeListing ? `₹${activeListing.price}` : ''}</div>
          </div>
        </motion.button>

        <motion.button type="button" className={styles.iconButton} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} aria-label="Wishlist" onClick={handleToggleWishlist} disabled={!user?.id || isToggling === 'wishlist'}>
          <HeartIcon filled={isInWishlist} />
        </motion.button>

        <motion.button type="button" className={styles.iconButton} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} aria-label="I have it" onClick={handleToggleBookshelf} disabled={!user?.id || isToggling === 'bookshelf'}>
          <HandIcon />
        </motion.button>

        <motion.button type="button" className={styles.iconButton} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} aria-label="Share" onClick={handleShare} disabled={!activeListing}>
          <ShareIcon />
        </motion.button>
      </motion.div>
    </div>
  )
}

