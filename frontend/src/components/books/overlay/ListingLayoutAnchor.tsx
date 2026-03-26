'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { ListingResponse } from '../../../utils/api'

import styles from './BooksOverlay.module.css'

export type ListingLayoutAnchorProps = {
  listing: ListingResponse
  layoutId: string
  onClick?: () => void
  rightSlot?: ReactNode
  subtitle?: string
}

export default function ListingLayoutAnchor({ listing, layoutId, onClick, rightSlot, subtitle }: ListingLayoutAnchorProps) {
  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      className={styles.anchorCard}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'grid', gap: 2 }}>
        <div className={styles.anchorTitle}>{listing.title}</div>
        <div className={styles.anchorPrice}>{subtitle ?? `Credits: ₹${listing.creditPrice}`}</div>
      </div>
      {rightSlot}
    </motion.button>
  )
}

