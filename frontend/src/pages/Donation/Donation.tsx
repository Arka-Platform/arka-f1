import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Input from '../../components/shared/Input/Input'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import { donationsApi, NGOResponse, DonationRequest } from '../../utils/api'
import styles from './Donation.module.css'

interface NGOCardProps {
  ngo: NGOResponse
  onSelect: (ngoId: string) => void
  isSelected: boolean
}

const NGOCard: React.FC<NGOCardProps> = ({ ngo, onSelect, isSelected }) => {
  return (
    <div
      className={`${styles.ngoCard} ${isSelected ? styles.ngoCardSelected : ''}`}
      onClick={() => onSelect(ngo.id)}
    >
      <div className={styles.ngoCardHeader}>
        <div>
          <h3 className={styles.ngoName}>{ngo.name}</h3>
          {ngo.location && (
            <p className={styles.ngoLocation}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {ngo.location}
            </p>
          )}
        </div>
        {ngo.verified && (
          <span className={styles.verifiedBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Verified
          </span>
        )}
      </div>
      {ngo.description && (
        <p className={styles.ngoDescription}>{ngo.description}</p>
      )}
      <div className={styles.ngoDetails}>
        {ngo.booksReceived && (
          <div className={styles.ngoStat}>
            <span className={styles.ngoStatLabel}>Books Received:</span>
            <span className={styles.ngoStatValue}>{ngo.booksReceived}</span>
          </div>
        )}
        {ngo.categories && ngo.categories.length > 0 && (
          <div className={styles.ngoCategories}>
            <span className={styles.ngoStatLabel}>Accepts:</span>
            <div className={styles.categoryTags}>
              {ngo.categories.slice(0, 3).map((cat, idx) => (
                <span key={idx} className={styles.categoryTag}>{cat}</span>
              ))}
              {ngo.categories.length > 3 && (
                <span className={styles.categoryTag}>+{ngo.categories.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Donation: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [ngos, setNgos] = useState<NGOResponse[]>([])
  const [selectedNgoId, setSelectedNgoId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [donorType, setDonorType] = useState<'INDIVIDUAL' | 'INSTITUTION'>('INDIVIDUAL')
  const [institutionName, setInstitutionName] = useState('')
  const [bookCount, setBookCount] = useState('')
  const [bookCategories, setBookCategories] = useState<string[]>([])
  const [condition, setCondition] = useState<'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'>('GOOD')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupCity, setPickupCity] = useState('')
  const [pickupState, setPickupState] = useState('')
  const [pickupPincode, setPickupPincode] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  useEffect(() => {
    loadNGOs()
    if (user) {
      setDonorName(`${user.firstName} ${user.lastName}`)
      setDonorEmail(user.email)
    }
  }, [user])

  const loadNGOs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await donationsApi.getNGOs()
      setNgos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NGOs')
      console.error('Error fetching NGOs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (category: string) => {
    setBookCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedNgoId) {
      showError('Please select an NGO to donate to')
      return
    }

    if (!donorName || !donorEmail || !donorPhone) {
      showError('Please fill in all required donor information')
      return
    }

    if (!bookCount || parseInt(bookCount) < 1) {
      showError('Please enter a valid number of books')
      return
    }

    if (!pickupAddress || !pickupCity || !pickupState || !pickupPincode) {
      showError('Please fill in complete pickup address')
      return
    }

    try {
      setSubmitting(true)
      const donationRequest: DonationRequest = {
        ngoId: selectedNgoId,
        donorName,
        donorEmail,
        donorPhone,
        donorType,
        institutionName: donorType === 'INSTITUTION' ? institutionName : undefined,
        bookCount: parseInt(bookCount),
        bookCategories: bookCategories.length > 0 ? bookCategories : undefined,
        condition,
        pickupAddress: {
          street: pickupAddress,
          city: pickupCity,
          state: pickupState,
          pincode: pickupPincode,
        },
        additionalNotes: additionalNotes || undefined,
        userId: user?.id,
      }

      await donationsApi.createDonation(donationRequest)
      success('Donation request submitted successfully! The NGO will contact you soon.')
      
      // Reset form
      setSelectedNgoId('')
      setDonorName(user ? `${user.firstName} ${user.lastName}` : '')
      setDonorEmail(user?.email || '')
      setDonorPhone('')
      setInstitutionName('')
      setBookCount('')
      setBookCategories([])
      setCondition('GOOD')
      setPickupAddress('')
      setPickupCity('')
      setPickupState('')
      setPickupPincode('')
      setAdditionalNotes('')
    } catch (err: any) {
      showError(err.message || 'Failed to submit donation request')
    } finally {
      setSubmitting(false)
    }
  }

  const bookCategoryOptions = [
    'Fiction', 'Non-Fiction', 'Textbooks', 'Children\'s Books', 'Academic',
    'Reference', 'Biography', 'History', 'Science', 'Literature', 'Other'
  ]

  return (
    <div className={styles.donation}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Donate Books to NGOs</h1>
        <p className={styles.subtitle}>
          Connect with verified NGOs and donate your books in bulk. Help spread knowledge and support education initiatives.
        </p>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* NGO Selection Section */}
          <section className={styles.ngosSection}>
            <h2 className={styles.sectionTitle}>Select an NGO</h2>
            {loading && (
              <div className={styles.loading}>
                <p>Loading NGOs...</p>
              </div>
            )}
            
            {error && (
              <div className={styles.error}>
                <p>Error: {error}</p>
              </div>
            )}
            
            {!loading && !error && ngos.length === 0 && (
              <div className={styles.empty}>
                <p>No NGOs available at the moment. Please check back later.</p>
              </div>
            )}
            
            {!loading && !error && ngos.length > 0 && (
              <div className={styles.ngosGrid}>
                {ngos.map((ngo) => (
                  <NGOCard
                    key={ngo.id}
                    ngo={ngo}
                    onSelect={setSelectedNgoId}
                    isSelected={selectedNgoId === ngo.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Donation Form Section */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Donation Details</h2>
            <form onSubmit={handleSubmit} className={styles.donationForm}>
              {/* Donor Information */}
              <div className={styles.formGroup}>
                <h3 className={styles.formGroupTitle}>Donor Information</h3>
                <div className={styles.formRow}>
                  <Input
                    label="Full Name *"
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    required
                    fullWidth
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
                <div className={styles.formRow}>
                  <Input
                    label="Phone Number *"
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    required
                    fullWidth
                  />
                  <Select
                    label="Donor Type *"
                    options={[
                      { value: 'INDIVIDUAL', label: 'Individual' },
                      { value: 'INSTITUTION', label: 'Institution' },
                    ]}
                    value={donorType}
                    onChange={(e) => setDonorType(e.target.value as 'INDIVIDUAL' | 'INSTITUTION')}
                    fullWidth
                  />
                </div>
                {donorType === 'INSTITUTION' && (
                  <Input
                    label="Institution Name *"
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    required
                    fullWidth
                  />
                )}
              </div>

              {/* Book Information */}
              <div className={styles.formGroup}>
                <h3 className={styles.formGroupTitle}>Book Information</h3>
                <div className={styles.formRow}>
                  <Input
                    label="Number of Books *"
                    type="number"
                    min="1"
                    value={bookCount}
                    onChange={(e) => setBookCount(e.target.value)}
                    required
                    fullWidth
                  />
                  <Select
                    label="Overall Condition *"
                    options={[
                      { value: 'NEW', label: 'New' },
                      { value: 'LIKE_NEW', label: 'Like New' },
                      { value: 'GOOD', label: 'Good' },
                      { value: 'FAIR', label: 'Fair' },
                    ]}
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    fullWidth
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Book Categories (Optional)</label>
                  <div className={styles.categoryCheckboxes}>
                    {bookCategoryOptions.map((cat) => (
                      <label key={cat} className={styles.categoryCheckbox}>
                        <input
                          type="checkbox"
                          checked={bookCategories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pickup Address */}
              <div className={styles.formGroup}>
                <h3 className={styles.formGroupTitle}>Pickup Address</h3>
                <Input
                  label="Street Address *"
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                  fullWidth
                />
                <div className={styles.formRow}>
                  <Input
                    label="City *"
                    type="text"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    required
                    fullWidth
                  />
                  <Input
                    label="State *"
                    type="text"
                    value={pickupState}
                    onChange={(e) => setPickupState(e.target.value)}
                    required
                    fullWidth
                  />
                  <Input
                    label="Pincode *"
                    type="text"
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="additionalNotes">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="additionalNotes"
                  className={styles.textarea}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={4}
                  placeholder="Any additional information about the books or pickup requirements..."
                />
              </div>

              {/* Submit Button */}
              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={submitting || !selectedNgoId}
                >
                  {submitting ? 'Submitting...' : 'Submit Donation Request'}
                </Button>
                {!selectedNgoId && (
                  <p className={styles.formHint}>Please select an NGO above to submit your donation request</p>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Donation


