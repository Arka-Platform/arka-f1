'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { BookResponse } from '../../utils/api'
import { booksApi } from '../../utils/api'

import BookActionOverlay from '../../components/books/overlay/BookActionOverlay'

const BooksBrowseScene = dynamic(() => import('../../components/books/three/BooksBrowseScene'), { ssr: false })

export default function BrowsePage() {
  const router = useRouter()

  const [books, setBooks] = useState<BookResponse[]>([])
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)
      try {
        // Limit count for performance; the arc placement still works naturally.
        const data = await booksApi.list({ page: 0, size: 8 })
        if (!mounted) return
        setBooks(data)
      } catch (e: any) {
        if (!mounted) return
        setErrorMsg(e?.message || 'Failed to load books')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const activeBook = useMemo(() => books.find((b) => b.id === activeBookId) ?? null, [books, activeBookId])

  const layoutId = activeBookId ? `book-${activeBookId}` : `book-none`

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {loading ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#e5e7eb',
            background: '#070A12',
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, opacity: 0.85 }}>Loading books…</div>
          </div>
        </div>
      ) : null}

      {errorMsg ? (
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 2, color: '#fff' }}>
          {errorMsg}
        </div>
      ) : null}

      <BooksBrowseScene
        books={books}
        activeBookId={activeBookId}
        onHoverChange={setActiveBookId}
        onSelectBook={(bookId) => router.push(`/books/${bookId}`)}
      />

      <BookActionOverlay
        activeBook={activeBook}
        layoutId={layoutId}
        onSelectDetail={(bookId) => router.push(`/books/${bookId}`)}
      />
    </div>
  )
}

