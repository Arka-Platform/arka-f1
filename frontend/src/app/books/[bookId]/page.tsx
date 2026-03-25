'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'

import type { BookResponse } from '../../../utils/api'
import { booksApi } from '../../../utils/api'

import BookActionOverlay from '../../../components/books/overlay/BookActionOverlay'

const BooksDetailScene = dynamic(() => import('../../../components/books/three/BooksDetailScene'), { ssr: false })

function ConditionGallery({ book }: { book: BookResponse }) {
  const { scrollYProgress } = useScroll()
  const fade = useTransform(scrollYProgress, [0, 0.2, 0.65], [0, 1, 1])
  const y = useTransform(scrollYProgress, [0, 0.25, 0.65], [18, 0, 0])

  const images = useMemo(() => {
    const list: { src: string; alt: string }[] = []
    if (book.thumbnailUrl) list.push({ src: book.thumbnailUrl, alt: `${book.title} (condition)` })
    if (book.imageUrl) list.push({ src: book.imageUrl, alt: `${book.title} (condition)` })
    // Fallback: even if images are missing, we keep the UI stable.
    return list
  }, [book.imageUrl, book.thumbnailUrl, book.title])

  return (
    <motion.section
      style={{ opacity: fade, y }}
      className="conditionSection"
    >
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '34px 18px' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h2 style={{ fontSize: 18, fontWeight: 750, color: '#f9fafb' }}>Condition & Details</h2>
            <p style={{ color: 'rgba(249,250,251,0.75)', lineHeight: 1.6, fontSize: 13 }}>
              {book.description || 'No additional condition notes provided.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {images.length > 0 ? (
              images.map((img) => (
                <motion.img
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 16, border: '1px solid rgba(255,255,255,0.10)' }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ))
            ) : (
              <div
                style={{
                  height: 260,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'rgba(249,250,251,0.7)',
                  background: 'rgba(17,24,39,0.35)',
                }}
              >
                No condition images available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default function BookDetailPage() {
  const params = useParams<{ bookId: string }>()
  const bookId = params.bookId

  const { scrollYProgress } = useScroll()
  const scrollProgress = scrollYProgress

  const [book, setBook] = useState<BookResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)
      try {
        const data = await booksApi.getById(bookId)
        if (!mounted) return
        setBook(data)
      } catch (e: any) {
        if (!mounted) return
        setErrorMsg(e?.message || 'Failed to load book')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [bookId])

  const layoutId = book ? `book-${book.id}` : 'book-none'

  return (
    <div style={{ minHeight: '100vh', background: '#070A12' }}>
      {book ? (
        <>
          <div style={{ position: 'relative', height: '58vh' }}>
            <BooksDetailScene book={book} scrollProgress={scrollProgress} />
            <BookActionOverlay activeBook={book} layoutId={layoutId} />
          </div>

          <ConditionGallery book={book} />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ maxWidth: 980, margin: '0 auto', padding: '0 18px 64px' }}
          >
            <div style={{ color: 'rgba(249,250,251,0.78)', fontSize: 13, lineHeight: 1.7, marginTop: -8 }}>
              <div style={{ height: 10 }} />
              <div style={{ fontWeight: 750, color: '#f9fafb', marginBottom: 8 }}>What you’ll get</div>
              {book.description || 'A great addition to your library.'}
            </div>
          </motion.div>
        </>
      ) : (
        <div
          style={{
            position: 'relative',
            height: '100vh',
            display: 'grid',
            placeItems: 'center',
            color: '#e5e7eb',
          }}
        >
          {loading ? 'Loading book…' : errorMsg || 'Something went wrong'}
        </div>
      )}
    </div>
  )
}

