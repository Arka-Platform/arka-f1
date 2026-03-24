import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import Input from '../../../components/shared/Input/Input'
import Button from '../../../components/shared/Button/Button'
import { adminApi, NGOResponse, CreateNGORequest, UpdateNGORequest } from '../../../utils/api'
import styles from './AdminNGOs.module.css'

const AdminNGOs: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const { success, error: showError } = useToast()
  const [ngos, setNgos] = useState<NGOResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNgo, setEditingNgo] = useState<NGOResponse | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [verified, setVerified] = useState(true) // Default to verified for new NGOs
  const [categoryInput, setCategoryInput] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      navigate('/admin/login')
      return
    }
    if (!user?.isAdmin) {
      showError('Admin access denied')
      navigate('/home')
      return
    }
    loadNGOs()
  }, [isAuthenticated, isLoading, user?.isAdmin])

  const loadNGOs = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getNGOs()
      setNgos(data)
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        navigate('/admin/login')
      } else {
        showError(err.message || 'Failed to load NGOs')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setLocation('')
    setCategories([])
    setContactEmail('')
    setContactPhone('')
    setWebsite('')
    setVerified(true) // Reset to verified for new NGOs
    setCategoryInput('')
    setEditingNgo(null)
    setShowForm(false)
  }

  const handleEdit = (ngo: NGOResponse) => {
    setEditingNgo(ngo)
    setName(ngo.name)
    setDescription(ngo.description || '')
    setLocation(ngo.location || '')
    setCategories(ngo.categories || [])
    setContactEmail(ngo.contactEmail || '')
    setContactPhone(ngo.contactPhone || '')
    setWebsite(ngo.website || '')
    setVerified(ngo.verified || false)
    setShowForm(true)
  }

  const handleAddCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setCategories([...categories, categoryInput.trim()])
      setCategoryInput('')
    }
  }

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      showError('NGO name is required')
      return
    }

    try {
      if (editingNgo) {
        const updateRequest: UpdateNGORequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          categories: categories.length > 0 ? categories : undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          website: website.trim() || undefined,
          verified
        }
        await adminApi.updateNGO(editingNgo.id, updateRequest)
        success('NGO updated successfully')
      } else {
        const createRequest: CreateNGORequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          categories: categories.length > 0 ? categories : undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          website: website.trim() || undefined,
          verified: verified
        }
        await adminApi.createNGO(createRequest)
        success('NGO created successfully')
      }
      
      resetForm()
      loadNGOs()
    } catch (err: any) {
      showError(err.message || 'Failed to save NGO')
    }
  }

  const handleDelete = async (ngoId: string) => {
    if (!confirm('Are you sure you want to delete this NGO? This action cannot be undone.')) {
      return
    }

    try {
      await adminApi.deleteNGO(ngoId)
      success('NGO deleted successfully')
      loadNGOs()
    } catch (err: any) {
      showError(err.message || 'Failed to delete NGO')
    }
  }

  const handleVerify = async (ngoId: string) => {
    try {
      await adminApi.verifyNGO(ngoId)
      success('NGO verified successfully')
      loadNGOs()
    } catch (err: any) {
      showError(err.message || 'Failed to verify NGO')
    }
  }

  if (loading) {
    return (
      <div className={styles.adminNGOs}>
        <div className={styles.loading}>Loading NGOs...</div>
      </div>
    )
  }

  return (
    <div className={styles.adminNGOs}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>NGO Management</h1>
          <p className={styles.subtitle}>Manage NGOs for book donations</p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/shipments')}
          >
            Shipments
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            + Add NGO
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {showForm && (
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>
            {editingNgo ? 'Edit NGO' : 'Create New NGO'}
          </h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <Input
                label="NGO Name *"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />
              <Input
                label="Location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="NGO description and mission..."
              />
            </div>

            <div className={styles.formRow}>
              <Input
                label="Contact Email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                fullWidth
              />
              <Input
                label="Contact Phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                fullWidth
              />
            </div>

            <Input
              label="Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              fullWidth
            />

            <div className={styles.formGroup}>
              <label className={styles.label}>Categories</label>
              <div className={styles.categoryInput}>
                <Input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  placeholder="Add category (e.g., Fiction, Textbooks)"
                  fullWidth
                />
                <Button type="button" variant="secondary" onClick={handleAddCategory}>
                  Add
                </Button>
              </div>
              {categories.length > 0 && (
                <div className={styles.categoryTags}>
                  {categories.map((cat, idx) => (
                    <span key={idx} className={styles.categoryTag}>
                      {cat}
                      <button
                        type="button"
                        className={styles.removeCategory}
                        onClick={() => handleRemoveCategory(cat)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                />
                <span>Verified NGO (will appear on donations page)</span>
              </label>
            </div>

            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {editingNgo ? 'Update NGO' : 'Create NGO'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.ngosList}>
        <h2 className={styles.listTitle}>All NGOs ({ngos.length})</h2>
        {ngos.length === 0 ? (
          <div className={styles.empty}>No NGOs found. Create your first NGO above.</div>
        ) : (
          <div className={styles.ngosGrid}>
            {ngos.map((ngo) => (
              <div key={ngo.id} className={styles.ngoCard}>
                <div className={styles.ngoCardHeader}>
                  <div>
                    <h3 className={styles.ngoName}>{ngo.name}</h3>
                    {ngo.verified && (
                      <span className={styles.verifiedBadge}>Verified</span>
                    )}
                  </div>
                </div>
                {ngo.location && (
                  <p className={styles.ngoLocation}>{ngo.location}</p>
                )}
                {ngo.description && (
                  <p className={styles.ngoDescription}>{ngo.description}</p>
                )}
                {ngo.categories && ngo.categories.length > 0 && (
                  <div className={styles.ngoCategories}>
                    {ngo.categories.map((cat, idx) => (
                      <span key={idx} className={styles.categoryTag}>{cat}</span>
                    ))}
                  </div>
                )}
                <div className={styles.ngoStats}>
                  <span>Books Received: {ngo.booksReceived || 0}</span>
                </div>
                <div className={styles.ngoActions}>
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(ngo)}
                  >
                    Edit
                  </Button>
                  {!ngo.verified && (
                    <Button
                      variant="primary"
                      onClick={() => handleVerify(ngo.id)}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(ngo.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminNGOs

