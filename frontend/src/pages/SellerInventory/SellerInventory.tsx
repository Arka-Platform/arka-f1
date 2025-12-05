import React, { useState, useEffect, useRef } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
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
  const statusMap: Record<string, 'available' | 'pending' | 'sold'> = {
    'PUBLISHED': 'available',
    'DRAFT': 'pending',
    'SOLD': 'sold',
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
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
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

  // Load inventory on mount
  useEffect(() => {
    if (user?.id) {
      loadInventory()
    }
  }, [user?.id])

  const loadInventory = async () => {
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
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file')
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
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    handleImageUpload(file)
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const result = await uploadApi.uploadBookImage(file)
      setFormData((prev) => ({ ...prev, image: result.url }))
      success('Image uploaded successfully!')
    } catch (err: any) {
      showError(err.message || 'Failed to upload image')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }))
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
        // Add new book
        await booksApi.create({
          title: formData.title,
          author: formData.author,
          description: formData.description,
          genre: formData.category,
          price: parseFloat(formData.price),
          imageUrl: formData.image || undefined,
        })
        success('Book added to your bookshelf!')
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
      })
      setImagePreview(null)
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
    })
    setImagePreview(book.image || null)
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
    })
    setImagePreview(null)
    setFormErrors({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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

  return (
    <div className={styles.inventory}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>My Bookshelf</h1>
            <p className={styles.pageDescription}>Manage your book listings and track sales</p>
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
            <div className={styles.statValue}>${stats.totalValue.toFixed(2)}</div>
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
                  label="Price ($) *"
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

              {/* Image Upload Section */}
              <div className={styles.imageUploadSection}>
                <label className={styles.imageUploadLabel}>Book Cover Image (optional)</label>
                
                {imagePreview || formData.image ? (
                  <div className={styles.imagePreviewContainer}>
                    <div className={styles.imagePreview}>
                      <img 
                        src={imagePreview || formData.image} 
                        alt="Book preview" 
                        className={styles.previewImage}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className={styles.removeImageButton}
                        aria-label="Remove image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    {uploadingImage && (
                      <div className={styles.uploadProgress}>
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.imageUploadArea}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageSelect}
                      className={styles.fileInput}
                      id="book-image-upload"
                      disabled={uploadingImage}
                    />
                    <label htmlFor="book-image-upload" className={styles.uploadLabel}>
                      <div className={styles.uploadIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div className={styles.uploadText}>
                        <p className={styles.uploadTitle}>
                          {uploadingImage ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className={styles.uploadSubtitle}>
                          PNG, JPG, WEBP or GIF (max. 5MB)
                        </p>
                      </div>
                    </label>
                  </div>
                )}
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
                      <span className={styles.bookPrice}>${book.price.toFixed(2)}</span>
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

