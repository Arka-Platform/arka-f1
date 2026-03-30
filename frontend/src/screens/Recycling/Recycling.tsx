import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Input from '../../components/shared/Input/Input'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import { recyclingApi, WastePaperResponse } from '../../utils/api'
import styles from './Recycling.module.css'

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'Newspaper', label: 'Newspaper' },
  { value: 'Magazine', label: 'Magazine' },
  { value: 'Office Paper', label: 'Office Paper' },
  { value: 'Cardboard', label: 'Cardboard' },
  { value: 'Books', label: 'Books' },
  { value: 'Mixed Paper', label: 'Mixed Paper' },
]

interface WastePaperCardProps {
  item: WastePaperResponse
  onSchedulePickup: () => void
}

const WastePaperCard: React.FC<WastePaperCardProps> = ({ item, onSchedulePickup }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>{item.title}</h3>
        {item.category && (
          <span className={styles.category}>{item.category}</span>
        )}
      </div>
      <p className={styles.description}>{item.description}</p>
      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Weight:</span>
          <span className={styles.detailValue}>{item.weightKg} kg</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Estimated value:</span>
          <span className={styles.detailValue}>₹{item.estimatedValue.toFixed(2)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status:</span>
          <span className={styles.detailValue}>{item.status}</span>
        </div>
      </div>
      {item.status === 'AVAILABLE' && (
        <div className={styles.cardActions}>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onSchedulePickup}
          >
            Schedule Pickup
          </Button>
        </div>
      )}
    </div>
  )
}

const Recycling: React.FC = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [items, setItems] = useState<WastePaperResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const params: { search?: string; category?: string } = {}
        
        if (searchQuery.trim()) {
          params.search = searchQuery.trim()
        } else if (selectedCategory) {
          params.category = selectedCategory
        }
        
        const data = await recyclingApi.list(params)
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load waste paper items')
        console.error('Error fetching recycling items:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [searchQuery, selectedCategory])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value)
    setSearchQuery('') // Clear search when filtering by category
  }

  return (
    <div className={styles.recycling}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Recycling & Waste Paper Pickup</h1>
        <p className={styles.subtitle}>
          Browse available waste paper for recycling and schedule a pickup. Part of the same circulation idea — materials move instead of sitting.
        </p>
      </div>

      {/* Search and Filters */}
      <section className={styles.searchSection}>
        <div className={styles.container}>
          <div className={styles.searchBar}>
            <Input
              type="text"
              placeholder="Search by title, description, or category..."
              value={searchQuery}
              onChange={handleSearchChange}
              fullWidth
            />
            <div className={styles.filters}>
              <Select
                options={categories}
                value={selectedCategory}
                onChange={handleCategoryChange}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Items List */}
      <section className={styles.itemsSection}>
        <div className={styles.container}>
          {loading && (
            <div className={styles.loading}>
              <p>Loading items...</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && items.length === 0 && (
            <div className={styles.empty}>
              <p>No waste paper items found. Try adjusting your search or filters.</p>
            </div>
          )}
          
          {!loading && !error && items.length > 0 && (
            <>
              <div className={styles.resultsInfo}>
                <p>Found {items.length} item{items.length !== 1 ? 's' : ''}</p>
              </div>
              <div className={styles.itemsGrid}>
                {items.map((item) => (
                  <WastePaperCard key={item.id} item={item} onSchedulePickup={() => router.push(`/order?recycling=${item.id}`)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Recycling

