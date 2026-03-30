'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Book } from '../shared/BookCard/BookCard'
import styles from './ContributeToUnlockModal.module.css'

type Props = {
  open: boolean
  book: Book | null
  onClose: () => void
}

export default function ContributeToUnlockModal({ open, book, onClose }: Props) {
  const router = useRouter()
  const cover = book?.image || book?.thumbnail

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const go = (path: string) => {
    onClose()
    router.push(path)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.backdrop}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="participation-nudge-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className={styles.bookCard}
              initial={{ rotate: -1, scale: 0.97 }}
              animate={{ rotate: [0, -3, 3, -2, 2, 0], scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {cover ? (
                <img src={cover} alt="" className={styles.bookThumb} referrerPolicy="no-referrer" />
              ) : null}
              <div className={styles.bookCardInner}>
                <span className={styles.bookGlyph} aria-hidden>
                  📖
                </span>
              </div>
            </motion.div>

            <h2 id="participation-nudge-title" className={styles.title}>
              This space works when books keep moving.
            </h2>
            <p className={styles.subtitle}>
              You have already added one book from the pool. To keep things balanced, add another title to the flow
              when you can — offer, match a &quot;looking for&quot;, or open your shelf.
            </p>

            <div className={styles.options}>
              <button type="button" className={styles.option} onClick={() => go('/inventory?focus=add')}>
                <span className={styles.optionIcon} aria-hidden>
                  📤
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Offer a book</span>
                  <span className={styles.optionDesc}>List something you are ready to pass on.</span>
                </span>
              </button>
              <button type="button" className={styles.option} onClick={() => go('/books#community-gets')}>
                <span className={styles.optionIcon} aria-hidden>
                  ◇
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Match a &quot;looking for&quot;</span>
                  <span className={styles.optionDesc}>See what people want and respond if you have it.</span>
                </span>
              </button>
              <button type="button" className={styles.option} onClick={() => go('/inventory')}>
                <span className={styles.optionIcon} aria-hidden>
                  📚
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Open your shelf</span>
                  <span className={styles.optionDesc}>Make sure a listed copy is available.</span>
                </span>
              </button>
            </div>

            <div className={styles.footer}>
              <p className={styles.footerNote}>
                Nothing here is about being &quot;good&quot; or &quot;needy&quot; — it is the same system from both
                sides. Come back when it fits; the nudge will wait.
              </p>
              <button type="button" className={styles.closeBtn} onClick={onClose}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
