'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { BookResponse } from '../../../utils/api'

import styles from './BooksOverlay.module.css'

export type BookLayoutAnchorProps = {
  book: BookResponse
  layoutId: string
  onClick?: () => void
  rightSlot?: ReactNode
  subtitle?: string
}

export default function BookLayoutAnchor({ book, layoutId, onClick, rightSlot, subtitle }: BookLayoutAnchorProps) {
  const price =
    typeof book.price === 'number'
      ? `₹${book.price}`
      : book.price != null
        ? String(book.price)
        : null

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      className={styles.anchorCard}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'grid', gap: 2 }}>
        <div className={styles.anchorTitle}>{book.title}</div>
        <div className={styles.anchorPrice}>
          {subtitle ?? (price ? `Credits: ${price}` : 'Book')}
        </div>
      </div>
      {rightSlot}
    </motion.button>
  )
}

