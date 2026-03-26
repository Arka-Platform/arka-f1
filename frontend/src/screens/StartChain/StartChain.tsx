import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../../contexts/ToastContext'
import { communityApi, CreateChainRequest } from '../../utils/api'
import { booksApi, BookResponse } from '../../utils/api'
import Input from '../../components/shared/Input/Input'
import Textarea from '../../components/shared/Textarea/Textarea'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import styles from './StartChain.module.css'

const StartChain: React.FC = () => {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    bookId: '',
    description: '',
  })
  const [books, setBooks] = useState<BookResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [booksLoading, setBooksLoading] = useState(true)
  const [errors, setErrors] = useState<{
    title?: string
    bookId?: string
  }>({})

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      setBooksLoading(true)
      const data = await booksApi.list({ page: 0, size: 50 })
      setBooks(data)
    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setBooksLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.bookId) {
      newErrors.bookId = 'Please select a book to start the chain'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      const request: CreateChainRequest = {
        title: formData.title.trim(),
        bookId: formData.bookId,
        description: formData.description.trim() || undefined,
      }
      await communityApi.createChain(request)
      success('Chain started successfully!')
      router.push('/home')
    } catch (err: any) {
      showError(err.message || 'Failed to start chain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.startChain}>
      <div className={styles.container}>
        <Button variant="outline" onClick={() => router.push('/home')} className={styles.backButton}>
          ← Back to Home
        </Button>

        <div className={styles.formCard}>
          <h1 className={styles.title}>Start a New Chain</h1>
          <p className={styles.subtitle}>
            Create a new book exchange chain. Share a book and watch it travel through the community!
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Chain Title *"
              placeholder="e.g., 'A Saffron Summer' or 'Climate Fiction Journey'"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
              fullWidth
              required
            />

            <Select
              label="Select Book to Start Chain *"
              options={[
                { value: '', label: 'Choose a book...' },
                ...books.map((book) => ({
                  value: book.id,
                  label: `${book.title} by ${book.author}`,
                })),
              ]}
              value={formData.bookId}
              onChange={(e) => handleInputChange('bookId', e.target.value)}
              error={errors.bookId}
              fullWidth
              required
            />

            {booksLoading && (
              <p className={styles.loadingText}>Loading books...</p>
            )}

            <Textarea
              label="Description (optional)"
              placeholder="Tell the community about this chain..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              rows={4}
            />

            <div className={styles.buttonGroup}>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading || booksLoading}
              >
                {loading ? 'Starting Chain...' : 'Start Chain'}
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => router.push('/home')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StartChain

