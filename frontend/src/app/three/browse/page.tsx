'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { booksApi, type BookResponse } from '../../../utils/api'
import BookActionOverlay from '../../../components/books/overlay/BookActionOverlay'

const BooksBrowseScene = dynamic(() => import('../../../components/books/three/BooksBrowseScene'), { ssr: false })

export default function ThreeBrowsePage() {
  const router = useRouter()
  const [books, setBooks] = useState<BookResponse[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)
      try {
        const data = await booksApi.list({ page: 0, size: 12 })
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

  const activeBook = useMemo(() => books.find((b) => b.id === activeId) ?? null, [books, activeId])
  const layoutId = activeId ? `book-${activeId}` : 'book-none'

  return (
    <div className="relative h-screen overflow-hidden bg-[#070A12]">
      {loading ? (
        <div className="absolute inset-0 z-[1] grid place-items-center text-white/80">
          Loading books…
        </div>
      ) : null}
      {errorMsg ? (
        <div className="absolute left-6 top-6 z-[2] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
          {errorMsg}
        </div>
      ) : null}
      {!loading && !errorMsg && books.length === 0 ? (
        <div className="absolute inset-0 z-[2] grid place-items-center text-center text-white/80">
          <div>
            <p className="text-base font-medium">No books yet.</p>
            <p className="mt-2 text-sm text-white/60">Add a book to see it here.</p>
          </div>
        </div>
      ) : null}

      <BooksBrowseScene
        books={books}
        activeBookId={activeId}
        onHoverChange={setActiveId}
        onSelectBook={() => router.push('/home')}
      />

      <BookActionOverlay
        activeBook={activeBook}
        layoutId={layoutId}
        onSelectDetail={() => router.push('/home')}
      />
    </div>
  )
}

