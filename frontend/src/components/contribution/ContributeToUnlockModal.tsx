'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Book } from '../shared/BookCard/BookCard'
import styles from './ContributeToUnlockModal.module.css'

type Props = {
  open: boolean
  book: Book | null
  presenceLabel: string
  onClose: () => void
}

export default function ContributeToUnlockModal({ open, book, presenceLabel, onClose }: Props) {
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
            aria-labelledby="contribute-unlock-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.presenceBar}>
              <div>
                <div className={styles.presenceLabel}>Your presence in the circle</div>
                <div className={styles.presenceHint}>{presenceLabel} — built from how you give back, not scores.</div>
              </div>
              <div className={styles.presenceWave} aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <motion.div
              className={styles.lockedCard}
              initial={{ rotate: -2, scale: 0.96 }}
              animate={{ rotate: [0, -5, 5, -4, 4, 0], scale: 1 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
            >
              {cover ? (
                <img src={cover} alt="" className={styles.lockedThumb} referrerPolicy="no-referrer" />
              ) : null}
              <div className={styles.lockedCardInner}>
                <span className={styles.lockBadge} aria-hidden>
                  🔒
                </span>
              </div>
            </motion.div>

            <h2 id="contribute-unlock-title" className={styles.title}>
              Contribute to unlock the library
            </h2>
            <p className={styles.subtitle}>
              This catalog stays alive when readers share. You&apos;ve already claimed your welcome book — add a
              small act of contribution to keep browsing.
            </p>

            <div className={styles.options}>
              <button type="button" className={styles.option} onClick={() => go('/inventory?focus=add')}>
                <span className={styles.optionIcon} aria-hidden>
                  📤
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Upload a book</span>
                  <span className={styles.optionDesc}>List something you&apos;re ready to pass on — it becomes part of the pool.</span>
                </span>
              </button>
              <button type="button" className={styles.option} onClick={() => go('/books#community-gets')}>
                <span className={styles.optionIcon} aria-hidden>
                  🤝
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Fulfill someone&apos;s request</span>
                  <span className={styles.optionDesc}>See what others are looking for and offer a copy if you have it.</span>
                </span>
              </button>
              <button type="button" className={styles.option} onClick={() => go('/inventory')}>
                <span className={styles.optionIcon} aria-hidden>
                  📚
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Offer a book you already listed</span>
                  <span className={styles.optionDesc}>Open your shelf and make sure a title is available for others.</span>
                </span>
              </button>
            </div>

            <div className={styles.footer}>
              <p className={styles.footerNote}>
                One welcome pickup is on us. After that, we ask everyone to give back in some small way — so this
                feels like a shared room, not a vending machine.
              </p>
              <button type="button" className={styles.closeBtn} onClick={onClose}>
                Not now
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
