import React, { useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
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

const SellerInventory: React.FC = () => {
  const { success } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState<InventoryBook | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Mock inventory data - in real app, this would come from API
  const [inventory, setInventory] = useState<InventoryBook[]>([
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      description: 'A classic American novel set in the Jazz Age.',
      price: 15.00,
      condition: 'like-new',
      category: 'Fiction',
      status: 'available',
      listedDate: '2024-01-15',
      views: 45,
      orders: 2,
    },
    {
      id: '2',
      title: 'Calculus: Early Transcendentals',
      author: 'James Stewart',
      isbn: '978-1-305-27033-6',
      description: 'Comprehensive calculus textbook, 8th edition.',
      price: 40.00,
      condition: 'good',
      category: 'Textbook',
      status: 'pending',
      listedDate: '2024-01-20',
      views: 23,
      orders: 1,
    },
    {
      id: '3',
      title: 'The Very Hungry Caterpillar',
      author: 'Eric Carle',
      description: 'A beloved children\'s book.',
      price: 10.00,
      condition: 'new',
      category: "Children's Books",
      status: 'sold',
      listedDate: '2024-01-10',
      views: 67,
      orders: 3,
    },
  ])

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    if (editingBook) {
      // Update existing book
      setInventory((prev) =>
        prev.map((book) =>
          book.id === editingBook.id
            ? {
                ...book,
                ...formData,
                price: parseFloat(formData.price),
              }
            : book
        )
      )
      success('Book updated successfully!')
      setEditingBook(null)
    } else {
      // Add new book
      const newBook: InventoryBook = {
        id: Date.now().toString(),
        ...formData,
        price: parseFloat(formData.price),
        status: 'available',
        listedDate: new Date().toISOString().split('T')[0],
        views: 0,
        orders: 0,
      }
      setInventory((prev) => [...prev, newBook])
      success('Book added to your bookshelf!')
    }

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
    setShowAddForm(false)
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
    setShowAddForm(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      setInventory((prev) => prev.filter((book) => book.id !== id))
      success('Book deleted successfully!')
    }
  }

  const handleStatusChange = (id: string, newStatus: InventoryBook['status']) => {
    setInventory((prev) =>
      prev.map((book) => (book.id === id ? { ...book, status: newStatus } : book))
    )
    success(`Book status updated to ${newStatus}!`)
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
    setFormErrors({})
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

              <Input
                label="Image URL (optional)"
                type="url"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="https://example.com/book-image.jpg"
                fullWidth
              />

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

