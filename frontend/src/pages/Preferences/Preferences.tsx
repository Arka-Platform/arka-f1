import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import Button from '../../components/shared/Button/Button'
import Select from '../../components/shared/Select/Select'
import SelectableTag from '../../components/shared/SelectableTag/SelectableTag'
import styles from './Preferences.module.css'

const Preferences: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()
  const [formData, setFormData] = useState({
    favoriteGenres: [] as string[],
    occupation: '',
    purpose: [] as string[],
    readingFrequency: '',
  })
  const [errors, setErrors] = useState<{
    favoriteGenres?: string
    occupation?: string
    purpose?: string
    readingFrequency?: string
  }>({})

  const genres = [
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
    'Philosophy',
    'Spirituality',
    'Poetry',
    'Drama',
    'Horror',
    'Young Adult',
    "Children's Books",
  ]

  const occupations = [
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'professional', label: 'Professional' },
    { value: 'business', label: 'Business' },
    { value: 'homemaker', label: 'Homemaker' },
    { value: 'retired', label: 'Retired' },
    { value: 'independent', label: 'Independent' },
  ]

  const purposes = [
    'Entertainment',
    'Education',
    'Professional Development',
    'Research',
    'Personal Growth',
    'General',
    'Awareness',
    'Book Club',
    'Gift Giving',
  ]

  const readingFrequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'occasionally', label: 'Occasionally' },
  ]

  const handleGenreToggle = (genre: string) => {
    setFormData((prev) => {
      const currentGenres = prev.favoriteGenres
      const newGenres = currentGenres.includes(genre)
        ? currentGenres.filter((g) => g !== genre)
        : [...currentGenres, genre]
      return { ...prev, favoriteGenres: newGenres }
    })
    // Clear error when user selects
    if (errors.favoriteGenres) {
      setErrors((prev) => ({ ...prev, favoriteGenres: undefined }))
    }
  }

  const handlePurposeToggle = (purpose: string) => {
    setFormData((prev) => {
      const currentPurposes = prev.purpose
      const newPurposes = currentPurposes.includes(purpose)
        ? currentPurposes.filter((p) => p !== purpose)
        : [...currentPurposes, purpose]
      return { ...prev, purpose: newPurposes }
    })
    // Clear error when user selects
    if (errors.purpose) {
      setErrors((prev) => ({ ...prev, purpose: undefined }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (formData.favoriteGenres.length === 0) {
      newErrors.favoriteGenres = 'Please select at least one favorite genre'
    }

    if (!formData.occupation) {
      newErrors.occupation = 'Please select what you do'
    }

    if (!formData.readingFrequency) {
      newErrors.readingFrequency = 'Please select your reading frequency'
    }

    if (formData.purpose.length === 0) {
      newErrors.purpose = 'Please select at least one purpose'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // TODO: Implement backend API for saving preferences
      // For now, save to localStorage
      localStorage.setItem('arka_user_preferences', JSON.stringify(formData))
      success('Preferences saved successfully!')
      // Navigate to home page after successful preferences submission
      navigate('/home')
    }
  }

  const handleSkip = () => {
    // Allow users to skip and go to home
    navigate('/home')
  }

  return (
    <div className={styles.preferences}>
      <div className={styles.container}>
        <div className={styles.preferencesCard}>
          <h1 className={styles.title}>Tell Us About Your Preferences</h1>
          <p className={styles.subtitle}>
            Help us personalize your Arka experience by sharing your reading preferences.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Favorite Genres */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                Favorite Genres <span className={styles.required}>*</span>
              </label>
              <p className={styles.sectionDescription}>Select all that apply</p>
              <div className={styles.tagGrid}>
                {genres.map((genre) => (
                  <SelectableTag
                    key={genre}
                    label={genre}
                    selected={formData.favoriteGenres.includes(genre)}
                    onClick={() => handleGenreToggle(genre)}
                  />
                ))}
              </div>
              {errors.favoriteGenres && (
                <span className={styles.errorText}>{errors.favoriteGenres}</span>
              )}
            </div>

            {/* Occupation */}
            <div className={styles.section}>
              <Select
                label="What do you do?"
                options={[{ value: '', label: 'Select your occupation...' }, ...occupations]}
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                error={errors.occupation}
                fullWidth
                required
              />
            </div>

            {/* Reading Frequency */}
            <div className={styles.section}>
              <Select
                label="How often do you read?"
                options={[{ value: '', label: 'Select your reading frequency...' }, ...readingFrequencies]}
                value={formData.readingFrequency}
                onChange={(e) => handleInputChange('readingFrequency', e.target.value)}
                error={errors.readingFrequency}
                fullWidth
                required
              />
            </div>

            {/* Purpose of Use */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                Purpose of Use <span className={styles.required}>*</span>
              </label>
              <p className={styles.sectionDescription}>Select all that apply</p>
              <div className={styles.tagGrid}>
                {purposes.map((purpose) => (
                  <SelectableTag
                    key={purpose}
                    label={purpose}
                    selected={formData.purpose.includes(purpose)}
                    onClick={() => handlePurposeToggle(purpose)}
                  />
                ))}
              </div>
              {errors.purpose && (
                <span className={styles.errorText}>{errors.purpose}</span>
              )}
            </div>

            <div className={styles.buttonGroup}>
              <Button type="submit" variant="primary" fullWidth>
                Save Preferences
              </Button>
              <Button type="button" variant="outline" fullWidth onClick={handleSkip}>
                Skip for Now
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Preferences

