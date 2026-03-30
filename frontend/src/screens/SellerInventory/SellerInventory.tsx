import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { useContribution } from '../../contexts/ContributionContext'
import { booksApi, BookResponse, uploadApi } from '../../utils/api'
import Input from '../../components/shared/Input/Input'
import Textarea from '../../components/shared/Textarea/Textarea'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import styles from './SellerInventory.module.css'

export interface InventoryBook {
  id: string
  title: string
  author: string
  isbn?: string
  description: string
  price: number
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
  category: string
  image?: string
  status: 'available' | 'pending' | 'sold'
  listedDate: string
  views?: number
  orders?: number
}

// Map BookResponse to InventoryBook
const bookToInventory = (book: BookResponse): InventoryBook => {
  // Map backend status to frontend status
  // PUBLISHED = available for sale
  // DRAFT = pending (not published yet)
  // RESERVED = pending (ordered but not delivered)
  // ARCHIVED = sold (delivered)
  // EXCHANGED = sold (exchanged)
  const statusMap: Record<string, 'available' | 'pending' | 'sold'> = {
    'PUBLISHED': 'available',
    'DRAFT': 'pending',
    'RESERVED': 'pending', // Book is ordered but not delivered yet
    'ARCHIVED': 'sold',    // Book is sold and delivered
    'EXCHANGED': 'sold',   // Book was exchanged
  }
  
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn || undefined,
    description: book.description || '',
    price: book.price || 0,
    condition: 'good', // Default since backend doesn't have condition field
    category: book.genre || 'Uncategorized',
    image: book.imageUrl || undefined,
    status: statusMap[book.status] || 'available',
    listedDate: book.createdAt ? new Date(book.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    views: book.ratingsCount || 0,
    orders: 0, // Not tracked in backend yet
  }
}

const SellerInventory: React.FC = () => {
  const { success, error: showError } = useToast()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const { refreshParticipation } = useContribution()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState<InventoryBook | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [inventory, setInventory] = useState<InventoryBook[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    price: '',
    condition: 'good' as InventoryBook['condition'],
    category: '',
    image: '',
    // Condition details
    conditionNotes: '',
    isWornOut: false,
    hasMissingPages: false,
    hasWriting: false,
    hasHighlights: false,
    hasUnderlining: false,
    hasTornPages: false,
    hasWaterDamage: false,
    hasStains: false,
    hasBentCorners: false,
    // Condition photos
    frontCoverPhoto: '',
    backCoverPhoto: '',
    spinePhoto: '',
    samplePagePhoto: '',
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadingPhotoType, setUploadingPhotoType] = useState<string | null>(null)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({})
  const fileInputRefs = {
    frontCover: useRef<HTMLInputElement>(null),
    backCover: useRef<HTMLInputElement>(null),
    spine: useRef<HTMLInputElement>(null),
    samplePage: useRef<HTMLInputElement>(null),
  }

  const categories = [
    'Fiction',
    'Non-Fiction',
    'Mystery & Thriller',
    'Science Fiction',
    'Fantasy',
    'Romance',
    'Biography',
    'History',
    'Self-Help',
    'Business',
    'Science',
    'Textbook',
    "Children's Books",
    'Young Adult',
  ]

  const conditions = [
    { value: 'new', label: 'New - Unread, perfect condition' },
    { value: 'like-new', label: 'Like New - Almost perfect, minor wear' },
    { value: 'good', label: 'Good - Some wear, but still readable' },
    { value: 'fair', label: 'Fair - Noticeable wear, but functional' },
    { value: 'poor', label: 'Poor - Significant wear, may have issues' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'pending', label: 'Pending' },
    { value: 'sold', label: 'Sold' },
  ]

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ]

  const loadInventory = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const books = await booksApi.getMyBooks(user.id)
      setInventory(books.map(bookToInventory))
    } catch (err) {
      showError('Failed to load inventory')
      console.error('Error loading inventory:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, showError])

  // Load inventory on mount and set up auto-refresh
  useEffect(() => {
    if (user?.id) {
      loadInventory()
      
      // Auto-refresh inventory every 30 seconds to catch order updates
      const interval = setInterval(() => {
        loadInventory()
      }, 30000) // 30 seconds
      
      // Refresh when page becomes visible (user switches back to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden && user?.id) {
          loadInventory()
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    } else {
      // If user is not logged in, stop loading
      setLoading(false)
    }
  }, [user?.id, loadInventory])

  useEffect(() => {
    if (searchParams.get('focus') !== 'add' || !user?.id) return
    setShowAddForm(true)
    setEditingBook(null)
  }, [searchParams, user?.id])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleConditionPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'frontCover' | 'backCover' | 'spine' | 'samplePage') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - be lenient for gallery files which might have empty or different MIME types
    // Check by file extension if MIME type is missing or invalid
    const hasValidExtension = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name)
    const hasValidMimeType = file.type.startsWith('image/')
    
    if (!hasValidMimeType && !hasValidExtension) {
      showError('Please select a valid image file (JPG, PNG, GIF, or WEBP)')
      // Clear the input so user can try again
      e.target.value = ''
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews((prev) => ({ ...prev, [photoType]: reader.result as string }))
    }
    reader.onerror = () => {
      showError('Failed to read image file')
    }
    reader.readAsDataURL(file)

    // Upload file
    await handleConditionPhotoUpload(file, photoType)
  }

  const handleConditionPhotoUpload = async (file: File, photoType: 'frontCover' | 'backCover' | 'spine' | 'samplePage') => {
    try {
      setUploadingPhotoType(photoType)
      console.log(`Uploading ${photoType} photo:`, {
        name: file.name,
        type: file.type,
        size: file.size,
      })
      const result = await uploadApi.uploadBookImage(file)
      const fieldName = `${photoType}Photo` as keyof typeof formData
      setFormData((prev) => ({ ...prev, [fieldName]: result.url }))
      success(`${photoType === 'frontCover' ? 'Front cover' : photoType === 'backCover' ? 'Back cover' : photoType === 'spine' ? 'Spine' : 'Sample page'} photo uploaded successfully!`)
    } catch (err: any) {
      console.error(`Error uploading ${photoType} photo:`, err)
      // Extract error message from API response
      let errorMessage = `Failed to upload ${photoType} photo`
      if (err?.response?.error) {
        errorMessage = err.response.error
      } else if (err?.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      showError(errorMessage)
      setImagePreviews((prev) => {
        const updated = { ...prev }
        delete updated[photoType]
        return updated
      })
    } finally {
      setUploadingPhotoType(null)
    }
  }

  const handleRemoveConditionPhoto = (photoType: 'frontCover' | 'backCover' | 'spine' | 'samplePage') => {
    const fieldName = `${photoType}Photo` as keyof typeof formData
    setFormData((prev) => ({ ...prev, [fieldName]: '' }))
    setImagePreviews((prev) => {
      const updated = { ...prev }
      delete updated[photoType]
      return updated
    })
    const inputRef = fileInputRefs[photoType].current
    if (inputRef) {
      inputRef.value = ''
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }

    if (!formData.author.trim()) {
      errors.author = 'Author is required'
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Valid price is required'
    }

    if (!formData.category) {
      errors.category = 'Category is required'
    }

    // Validate condition photos - at least front cover is required
    if (!formData.frontCoverPhoto) {
      errors.frontCoverPhoto = 'Front cover photo is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingBook) {
        // Update existing book
        await booksApi.update(editingBook.id, {
          title: formData.title,
          author: formData.author,
          description: formData.description,
          genre: formData.category,
          price: parseFloat(formData.price),
          imageUrl: formData.image || undefined,
        })
        success('Book updated successfully!')
      } else {
        // Add new book - it will be published to the marketplace automatically
        // Use front cover photo as the main image
        if (!user?.id) {
          showError('Please log in to add a book')
          return
        }
        await booksApi.create(user.id, {
          title: formData.title,
          author: formData.author,
          description: formData.description,
          genre: formData.category,
          price: parseFloat(formData.price),
          imageUrl: formData.frontCoverPhoto || undefined,
          // TODO: Add condition fields to backend API
          // condition: formData.condition,
          // conditionNotes: formData.conditionNotes,
          // conditionFlags: {
          //   isWornOut: formData.isWornOut,
          //   hasMissingPages: formData.hasMissingPages,
          //   hasWriting: formData.hasWriting,
          //   hasHighlights: formData.hasHighlights,
          //   hasUnderlining: formData.hasUnderlining,
          //   hasTornPages: formData.hasTornPages,
          //   hasWaterDamage: formData.hasWaterDamage,
          //   hasStains: formData.hasStains,
          //   hasBentCorners: formData.hasBentCorners,
          // },
          // conditionPhotos: {
          //   frontCover: formData.frontCoverPhoto,
          //   backCover: formData.backCoverPhoto,
          //   spine: formData.spinePhoto,
          //   samplePage: formData.samplePagePhoto,
          // },
        })
        success('Book added to marketplace! It is now available for purchase.')
        void refreshParticipation()
      }

      // Reload inventory
      await loadInventory()
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        price: '',
        condition: 'good',
        category: '',
        image: '',
        conditionNotes: '',
        isWornOut: false,
        hasMissingPages: false,
        hasWriting: false,
        hasHighlights: false,
        hasUnderlining: false,
        hasTornPages: false,
        hasWaterDamage: false,
        hasStains: false,
        hasBentCorners: false,
        frontCoverPhoto: '',
        backCoverPhoto: '',
        spinePhoto: '',
        samplePagePhoto: '',
      })
      setImagePreviews({})
      setShowAddForm(false)
      setEditingBook(null)
    } catch (err) {
      showError(editingBook ? 'Failed to update book' : 'Failed to add book')
      console.error('Error saving book:', err)
    }
  }

  const handleEdit = (book: InventoryBook) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      description: book.description,
      price: book.price.toString(),
      condition: book.condition,
      category: book.category,
      image: book.image || '',
      conditionNotes: '',
      isWornOut: false,
      hasMissingPages: false,
      hasWriting: false,
      hasHighlights: false,
      hasUnderlining: false,
      hasTornPages: false,
      hasWaterDamage: false,
      hasStains: false,
      hasBentCorners: false,
      frontCoverPhoto: '',
      backCoverPhoto: '',
      spinePhoto: '',
      samplePagePhoto: '',
    })
    setImagePreviews({})
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return
    }
    
    try {
      await booksApi.delete(id)
      success('Book deleted successfully!')
      await loadInventory()
    } catch (err) {
      showError('Failed to delete book')
      console.error('Error deleting book:', err)
    }
  }

  const handleStatusChange = async (id: string, newStatus: InventoryBook['status']) => {
    // Map frontend status to backend status
    const statusMap: Record<string, string> = {
      'available': 'PUBLISHED',
      'pending': 'DRAFT',
      'sold': 'SOLD',
    }
    
    try {
      await booksApi.updateStatus(id, statusMap[newStatus])
      success(`Book status updated to ${newStatus}!`)
      await loadInventory()
    } catch (err) {
      showError('Failed to update book status')
      console.error('Error updating status:', err)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingBook(null)
    setFormData({
      title: '',
      author: '',
      isbn: '',
      description: '',
      price: '',
      condition: 'good',
      category: '',
      image: '',
      conditionNotes: '',
      isWornOut: false,
      hasMissingPages: false,
      hasWriting: false,
      hasHighlights: false,
      hasUnderlining: false,
      hasTornPages: false,
      hasWaterDamage: false,
      hasStains: false,
      hasBentCorners: false,
      frontCoverPhoto: '',
      backCoverPhoto: '',
      spinePhoto: '',
      samplePagePhoto: '',
    })
    setImagePreviews({})
    setFormErrors({})
    // Clear all file inputs
    Object.values(fileInputRefs).forEach(ref => {
      if (ref.current) {
        ref.current.value = ''
      }
    })
  }

  // Filter and search inventory
  const filteredInventory = inventory.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.isbn && book.isbn.includes(searchQuery))

    const matchesStatus = statusFilter === 'all' || book.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Calculate statistics
  const stats = {
    total: inventory.length,
    available: inventory.filter((b) => b.status === 'available').length,
    pending: inventory.filter((b) => b.status === 'pending').length,
    sold: inventory.filter((b) => b.status === 'sold').length,
    totalValue: inventory
      .filter((b) => b.status === 'available')
      .reduce((sum, b) => sum + b.price, 0),
  }

  const getStatusColor = (status: InventoryBook['status']) => {
    switch (status) {
      case 'available':
        return styles.statusAvailable
      case 'pending':
        return styles.statusPending
      case 'sold':
        return styles.statusSold
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className={styles.inventory}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading inventory...</div>
        </div>
      </div>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className={styles.inventory}>
        <div className={styles.container}>
          <div className={styles.authPrompt}>
            <div className={styles.authPromptIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 className={styles.authPromptTitle}>Sign in to manage your bookshelf</h2>
            <p className={styles.authPromptDescription}>
              You need to be logged in to view and manage your book inventory. 
              Sign in to your account or create a new one to get started.
            </p>
            <div className={styles.authPromptActions}>
              <Link href="/login" className={styles.authButtonPrimary}>
                Log In
              </Link>
              <Link href="/register" className={styles.authButtonOutline}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.inventory}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>My Bookshelf</h1>
            <p className={styles.pageDescription}>
              Offer copies into the shared pool and track what is live.{' '}
              <Link href="/donation" className={styles.inlineLink}>
                Many books to a partner organization?
              </Link>
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setShowAddForm(true)
              setEditingBook(null)
            }}
          >
            + Add New Book
          </Button>
        </div>

        {/* Statistics */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Books</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.available}</div>
            <div className={styles.statLabel}>Available</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.sold}</div>
            <div className={styles.statLabel}>Sold</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>₹{stats.totalValue.toFixed(2)}</div>
            <div className={styles.statLabel}>Bookshelf Value</div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              {editingBook ? 'Edit Book' : 'Add New Book'}
            </h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <Input
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={formErrors.title}
                  fullWidth
                  required
                />
                <Input
                  label="Author *"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  error={formErrors.author}
                  fullWidth
                  required
                />
              </div>

              <div className={styles.formRow}>
                <Input
                  label="ISBN (optional)"
                  value={formData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Price (₹) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  error={formErrors.price}
                  fullWidth
                  required
                />
              </div>

              <div className={styles.formRow}>
                <Select
                  label="Category *"
                  options={[
                    { value: '', label: 'Select category...' },
                    ...categories.map((cat) => ({ value: cat, label: cat })),
                  ]}
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  error={formErrors.category}
                  fullWidth
                  required
                />
                <Select
                  label="Condition *"
                  options={conditions}
                  value={formData.condition}
                  onChange={(e) =>
                    handleInputChange('condition', e.target.value as InventoryBook['condition'])
                  }
                  fullWidth
                  required
                />
              </div>

              <Textarea
                label="Description *"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={formErrors.description}
                fullWidth
                rows={4}
                required
              />

              {/* Condition Details Section */}
              <div className={styles.conditionSection}>
                <h3 className={styles.sectionTitle}>Book Condition Details</h3>
                
                <Textarea
                  label="Condition Notes (optional)"
                  placeholder="Describe any specific condition issues, wear patterns, or other details buyers should know..."
                  value={formData.conditionNotes}
                  onChange={(e) => handleInputChange('conditionNotes', e.target.value)}
                  fullWidth
                  rows={3}
                />

                <div className={styles.conditionCheckboxes}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isWornOut}
                      onChange={(e) => handleInputChange('isWornOut', e.target.checked)}
                    />
                    <span>Worn out / Significant wear</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasMissingPages}
                      onChange={(e) => handleInputChange('hasMissingPages', e.target.checked)}
                    />
                    <span>Missing pages</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasWriting}
                      onChange={(e) => handleInputChange('hasWriting', e.target.checked)}
                    />
                    <span>Writing / Notes in margins</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasHighlights}
                      onChange={(e) => handleInputChange('hasHighlights', e.target.checked)}
                    />
                    <span>Highlights</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasUnderlining}
                      onChange={(e) => handleInputChange('hasUnderlining', e.target.checked)}
                    />
                    <span>Underlining</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasTornPages}
                      onChange={(e) => handleInputChange('hasTornPages', e.target.checked)}
                    />
                    <span>Torn pages</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasWaterDamage}
                      onChange={(e) => handleInputChange('hasWaterDamage', e.target.checked)}
                    />
                    <span>Water damage</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasStains}
                      onChange={(e) => handleInputChange('hasStains', e.target.checked)}
                    />
                    <span>Stains</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.hasBentCorners}
                      onChange={(e) => handleInputChange('hasBentCorners', e.target.checked)}
                    />
                    <span>Bent corners / Dog-eared pages</span>
                  </label>
                </div>
              </div>

              {/* Condition Photos Section */}
              <div className={styles.conditionPhotosSection}>
                <h3 className={styles.sectionTitle}>Condition Photos *</h3>
                <p className={styles.sectionSubtitle}>Upload photos from your camera or gallery. Front cover is required.</p>
                
                <div className={styles.conditionPhotosGrid}>
                  {/* Front Cover Photo */}
                  <div className={styles.conditionPhotoItem}>
                    <label className={styles.conditionPhotoLabel}>Front Cover *</label>
                    {imagePreviews.frontCover || formData.frontCoverPhoto ? (
                      <div className={styles.conditionPhotoPreview}>
                        <img 
                          src={imagePreviews.frontCover || formData.frontCoverPhoto} 
                          alt="Front cover" 
                          className={styles.conditionPreviewImage}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveConditionPhoto('frontCover')}
                          className={styles.removePhotoButton}
                          aria-label="Remove front cover photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        {uploadingPhotoType === 'frontCover' && (
                          <div className={styles.uploadProgress}>Uploading...</div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.conditionPhotoUpload}>
                        <input
                          ref={fileInputRefs.frontCover}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/*"
                          onChange={(e) => handleConditionPhotoSelect(e, 'frontCover')}
                          className={styles.fileInput}
                          id="front-cover-photo"
                          disabled={uploadingPhotoType === 'frontCover'}
                        />
                        <label htmlFor="front-cover-photo">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>Take Photo</span>
                        </label>
                      </div>
                    )}
                    {formErrors.frontCoverPhoto && (
                      <span className={styles.fieldError}>{formErrors.frontCoverPhoto}</span>
                    )}
                  </div>

                  {/* Back Cover Photo */}
                  <div className={styles.conditionPhotoItem}>
                    <label className={styles.conditionPhotoLabel}>Back Cover</label>
                    {imagePreviews.backCover || formData.backCoverPhoto ? (
                      <div className={styles.conditionPhotoPreview}>
                        <img 
                          src={imagePreviews.backCover || formData.backCoverPhoto} 
                          alt="Back cover" 
                          className={styles.conditionPreviewImage}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveConditionPhoto('backCover')}
                          className={styles.removePhotoButton}
                          aria-label="Remove back cover photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        {uploadingPhotoType === 'backCover' && (
                          <div className={styles.uploadProgress}>Uploading...</div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.conditionPhotoUpload}>
                        <input
                          ref={fileInputRefs.backCover}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/*"
                          onChange={(e) => handleConditionPhotoSelect(e, 'backCover')}
                          className={styles.fileInput}
                          id="back-cover-photo"
                          disabled={uploadingPhotoType === 'backCover'}
                        />
                        <label htmlFor="back-cover-photo">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>Take Photo</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Spine Photo */}
                  <div className={styles.conditionPhotoItem}>
                    <label className={styles.conditionPhotoLabel}>Spine</label>
                    {imagePreviews.spine || formData.spinePhoto ? (
                      <div className={styles.conditionPhotoPreview}>
                        <img 
                          src={imagePreviews.spine || formData.spinePhoto} 
                          alt="Spine" 
                          className={styles.conditionPreviewImage}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveConditionPhoto('spine')}
                          className={styles.removePhotoButton}
                          aria-label="Remove spine photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        {uploadingPhotoType === 'spine' && (
                          <div className={styles.uploadProgress}>Uploading...</div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.conditionPhotoUpload}>
                        <input
                          ref={fileInputRefs.spine}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/*"
                          onChange={(e) => handleConditionPhotoSelect(e, 'spine')}
                          className={styles.fileInput}
                          id="spine-photo"
                          disabled={uploadingPhotoType === 'spine'}
                        />
                        <label htmlFor="spine-photo">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>Take Photo</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Sample Page Photo */}
                  <div className={styles.conditionPhotoItem}>
                    <label className={styles.conditionPhotoLabel}>Sample Page</label>
                    {imagePreviews.samplePage || formData.samplePagePhoto ? (
                      <div className={styles.conditionPhotoPreview}>
                        <img 
                          src={imagePreviews.samplePage || formData.samplePagePhoto} 
                          alt="Sample page" 
                          className={styles.conditionPreviewImage}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveConditionPhoto('samplePage')}
                          className={styles.removePhotoButton}
                          aria-label="Remove sample page photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        {uploadingPhotoType === 'samplePage' && (
                          <div className={styles.uploadProgress}>Uploading...</div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.conditionPhotoUpload}>
                        <input
                          ref={fileInputRefs.samplePage}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/*"
                          onChange={(e) => handleConditionPhotoSelect(e, 'samplePage')}
                          className={styles.fileInput}
                          id="sample-page-photo"
                          disabled={uploadingPhotoType === 'samplePage'}
                        />
                        <label htmlFor="sample-page-photo">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>Take Photo</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingBook ? 'Update Book' : 'Add Book'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className={styles.filtersSection}>
          <Input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.filters}>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Bookshelf */}
        <div className={styles.inventoryList}>
          {filteredInventory.length === 0 ? (
            <div className={styles.emptyState}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={styles.emptyIcon}
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <h3 className={styles.emptyTitle}>
                {inventory.length === 0 ? 'Your bookshelf is empty' : 'No books match your filters'}
              </h3>
              <p className={styles.emptyDescription}>
                {inventory.length === 0
                  ? 'Start by adding your first book to sell'
                  : 'Try adjusting your search or filters'}
              </p>
              {inventory.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowAddForm(true)
                    setEditingBook(null)
                  }}
                >
                  Add Your First Book
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.booksGrid}>
              {filteredInventory.map((book) => (
                <div key={book.id} className={styles.bookCard}>
                  <div className={styles.bookImage}>
                    {book.image ? (
                      <img src={book.image} alt={book.title} />
                    ) : (
                      <div className={styles.placeholderImage}>
                        <svg viewBox="0 0 200 200" className={styles.placeholderSvg}>
                          <rect width="200" height="200" fill="currentColor" opacity="0.1" />
                          <rect x="50" y="30" width="100" height="140" fill="currentColor" opacity="0.3" />
                        </svg>
                      </div>
                    )}
                    <span className={`${styles.statusBadge} ${getStatusColor(book.status)}`}>
                      {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                    </span>
                  </div>
                  <div className={styles.bookContent}>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>by {book.author}</p>
                    <p className={styles.bookCategory}>{book.category}</p>
                    <div className={styles.bookMeta}>
                      <span className={styles.bookCondition}>
                        Condition: {conditions.find((c) => c.value === book.condition)?.label}
                      </span>
                      <span className={styles.bookPrice}>₹{book.price.toFixed(2)}</span>
                    </div>
                    {book.views !== undefined && (
                      <div className={styles.bookStats}>
                        <span>{book.views} views</span>
                        {book.orders !== undefined && book.orders > 0 && (
                          <span>{book.orders} orders</span>
                        )}
                      </div>
                    )}
                    <div className={styles.bookActions}>
                      <div className={styles.statusSelect}>
                        <Select
                          options={[
                            { value: 'available', label: 'Available' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'sold', label: 'Sold' },
                          ]}
                          value={book.status}
                          onChange={(e) =>
                            handleStatusChange(book.id, e.target.value as InventoryBook['status'])
                          }
                          fullWidth
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(book)}
                        className={styles.actionButton}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(book.id)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerInventory

