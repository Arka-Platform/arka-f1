import React, { useId, useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import BookCard, { Book } from '../../components/shared/BookCard/BookCard'
import Input from '../../components/shared/Input/Input'
import Select from '../../components/shared/Select/Select'
import Button from '../../components/shared/Button/Button'
import BookSearchInput from '../../components/shared/BookSearchInput/BookSearchInput'
import TrustScoreBadge from '../../components/shared/TrustScoreBadge/TrustScoreBadge'
import RecommendationSection from '../../components/shared/RecommendationSection/RecommendationSection'
import RecentlyServedCarousel from '../../components/shared/RecentlyServedCarousel/RecentlyServedCarousel'
import { useCart } from '../../contexts/CartContext'
import { booksApi, BookResponse, wishlistApi } from '../../utils/api'
import { demandApi, BookRequestResponse, CreateBookRequestRequest, CreateRequestResponse, MatchResponse, trustScoreApi, usersApi } from '../../utils/api'
import { trackBookView, trackCartAdd } from '../../utils/tracking'
import { openContactRequesterEmail } from '../../utils/contactRequester'
import styles from './BooksMarketplace.module.css'

interface RequestCardProps {
  request: BookRequestResponse
  onFulfill?: (requestId: string) => void
  onCancel?: (requestId: string) => void
  isOwner: boolean
  onSelectMatch?: (requestId: string, match: MatchResponse) => void
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onFulfill, onCancel, isOwner, onSelectMatch }) => {
  const [matches, setMatches] = useState<MatchResponse[]>([])
  const [previousMatchCount, setPreviousMatchCount] = useState(0)
  const [showMatchDetails, setShowMatchDetails] = useState(false)
  const [fulfillerTrustScore, setFulfillerTrustScore] = useState<number | null>(null)
  const { success } = useToast()

  useEffect(() => {
    // Always load matches for the request owner if it's an open request
    if (isOwner && request.status === 'OPEN') {
      loadMatches()
      // Poll for new matches every 30 seconds
      const interval = setInterval(() => {
        loadMatches()
      }, 30000)
      return () => clearInterval(interval)
    }
    // Load trust score if request is fulfilled
    if (request.fulfilledBy && request.status === 'FULFILLED') {
      loadFulfillerTrustScore()
    }
  }, [request.id, request.fulfilledBy, request.status, isOwner])

  const loadFulfillerTrustScore = async () => {
    if (!request.fulfilledBy) return
    try {
      const scoreData = await trustScoreApi.getTrustScore(request.fulfilledBy)
      setFulfillerTrustScore(scoreData.trustScore)
    } catch (error: any) {
      if (error.message && !error.message.includes('User not found')) {
        console.error('Error loading trust score:', error)
      }
      setFulfillerTrustScore(null)
    }
  }

  const loadMatches = async () => {
    if (!isOwner) return
    try {
      const data = await demandApi.getMatchesForRequest(request.id, request.requesterId)
      const newMatches = data.slice(0, 10)
      
      if (previousMatchCount > 0 && newMatches.length > previousMatchCount) {
        const newMatchCount = newMatches.length - previousMatchCount
        success(`🎉 ${newMatchCount} new match${newMatchCount > 1 ? 'es' : ''} found for "${request.title}"!`)
        if (!showMatchDetails) {
          setShowMatchDetails(true)
        }
      }
      
      setMatches(newMatches)
      setPreviousMatchCount(newMatches.length)
    } catch (err) {
      console.error('Failed to load matches:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#10b981'
      case 'FULFILLED': return '#3b82f6'
      case 'COMPLETED': return '#6366f1'
      case 'CANCELLED': return '#ef4444'
      case 'EXPIRED': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'HIGH': return '#ef4444'
      case 'MEDIUM': return '#f59e0b'
      case 'LOW': return '#10b981'
      default: return '#6b7280'
    }
  }

  return (
    <div className={styles.requestCard}>
      <div className={styles.requestHeader}>
        <div>
          <h3 className={styles.requestTitle}>{request.title}</h3>
          <p className={styles.requestAuthor}>by {request.author}</p>
        </div>
        <div className={styles.requestMeta}>
          <span 
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(request.status) + '20', color: getStatusColor(request.status) }}
          >
            {request.status}
          </span>
          {request.urgency && (
            <span 
              className={styles.urgencyBadge}
              style={{ backgroundColor: getUrgencyColor(request.urgency) + '20', color: getUrgencyColor(request.urgency) }}
            >
              {request.urgency} Priority
            </span>
          )}
        </div>
      </div>

      {request.description && (
        <p className={styles.requestDescription}>{request.description}</p>
      )}

      <div className={styles.requestDetails}>
        {request.genre && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Genre:</span>
            <span className={styles.detailValue}>{request.genre}</span>
          </div>
        )}
        {request.preferredCondition && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Condition:</span>
            <span className={styles.detailValue}>{request.preferredCondition}</span>
          </div>
        )}
        {request.location && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Location:</span>
            <span className={styles.detailValue}>{request.location}</span>
          </div>
        )}
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Views:</span>
          <span className={styles.detailValue}>{request.viewsCount || 0}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Offers:</span>
          <span className={styles.detailValue}>{request.offersCount || 0}</span>
        </div>
      </div>

      {request.fulfilledByName && (
        <div className={styles.fulfilledInfo}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className={styles.fulfilledInfoContent}>
            <span>Fulfilled by {request.fulfilledByName}</span>
            {fulfillerTrustScore !== null && (
              <TrustScoreBadge trustScore={fulfillerTrustScore} size="small" showLabel={false} />
            )}
          </div>
        </div>
      )}

      {isOwner && request.status === 'OPEN' && (
        <div className={styles.matchesSection}>
          {matches.length > 0 ? (
            <>
              <button
                className={styles.matchesToggle}
                onClick={() => setShowMatchDetails(!showMatchDetails)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <span className={styles.matchesCount}>
                  {matches.length} Match{matches.length !== 1 ? 'es' : ''} Found
                  {previousMatchCount > 0 && matches.length > previousMatchCount && (
                    <span className={styles.newMatchesBadge}>New!</span>
                  )}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ transform: showMatchDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showMatchDetails && (
                <div className={styles.matchesList}>
                  {matches.map((match) => (
                    <div key={match.bookId} className={styles.matchItem}>
                      <div className={styles.matchInfo}>
                        <div className={styles.matchTitle}>{match.bookTitle}</div>
                        <div className={styles.matchAuthor}>by {match.bookAuthor}</div>
                        <div className={styles.matchScore}>
                          <span className={styles.matchScoreLabel}>Match:</span>
                          <span className={styles.matchScoreValue}>{Math.round(match.matchScore)}%</span>
                        </div>
                        {match.matchReasons.length > 0 && (
                          <div className={styles.matchReasons}>
                            {match.matchReasons.slice(0, 2).map((reason, idx) => (
                              <span key={idx} className={styles.matchReasonTag}>{reason}</span>
                            ))}
                          </div>
                        )}
                        <div className={styles.matchSeller}>
                          <span className={styles.sellerLabel}>Seller:</span>
                          <span className={styles.sellerName}>{match.sellerName}</span>
                        </div>
                      </div>
                      <div className={styles.matchActions}>
                        <div className={styles.matchPrice}>₹{match.bookPrice.toFixed(2)}</div>
                        <Button
                          variant="primary"
                          onClick={() => {
                            if (onSelectMatch) {
                              onSelectMatch(request.id, match)
                            }
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.noMatches}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>No matches found yet. We'll notify you when a book becomes available!</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.requestActions}>
        {isOwner && request.status === 'OPEN' && (
          <Button variant="secondary" onClick={() => onCancel?.(request.id)}>
            Cancel
          </Button>
        )}
        {!isOwner && request.status === 'OPEN' && (
          <Button variant="primary" onClick={() => onFulfill?.(request.id)}>
            I Have This
          </Button>
        )}
      </div>
    </div>
  )
}

const BooksMarketplace: React.FC = () => {
  const reactId = useId()
  const { user, register } = useAuth()
  const { success, error: showError } = useToast()
  const { addToCart } = useCart()
  const searchParams = useSearchParams()
  
  // Book browsing state
  const searchQuery = searchParams.get('search') || searchParams.get('q') || ''
  const [books, setBooks] = useState<Book[]>([])
  const [visibleBooksCount, setVisibleBooksCount] = useState(20)
  const [booksLoading, setBooksLoading] = useState(true)
  const [booksError, setBooksError] = useState<string | null>(null)
  
  // Request state
  const [requests, setRequests] = useState<BookRequestResponse[]>([])
  const [myRequests, setMyRequests] = useState<BookRequestResponse[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestSearchQuery, setRequestSearchQuery] = useState('')
  const [debouncedRequestSearchQuery, setDebouncedRequestSearchQuery] = useState('')

  // Form state for requests
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [isbn, setIsbn] = useState('')
  const [preferredCondition, setPreferredCondition] = useState('ANY')
  const [urgency, setUrgency] = useState('MEDIUM')
  const [pincode, setPincode] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  
  // Auto-fill state
  const [submittedMatches, setSubmittedMatches] = useState<MatchResponse[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [showMatchSelection, setShowMatchSelection] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showRequestFormModal, setShowRequestFormModal] = useState(false)
  const [selectedBookForRequest, setSelectedBookForRequest] = useState<BookResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionType, setActionType] = useState<'wishlist' | 'match' | null>(null)
  const requestModalContentRef = useRef<HTMLDivElement | null>(null)
  const requestModalCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  
  // Missing info form
  const [showMissingInfoForm, setShowMissingInfoForm] = useState(false)
  const [selectedMatchForInfo, setSelectedMatchForInfo] = useState<{requestId: string, match: MatchResponse} | null>(null)
  const [missingInfoName, setMissingInfoName] = useState('')
  const [missingInfoEmail, setMissingInfoEmail] = useState('')
  const [missingInfoPassword, setMissingInfoPassword] = useState('')
  const [missingInfoPhone, setMissingInfoPhone] = useState('')
  const [missingInfoStreet, setMissingInfoStreet] = useState('')
  const [missingInfoCity, setMissingInfoCity] = useState('')
  const [missingInfoState, setMissingInfoState] = useState('')
  const [missingInfoPincode, setMissingInfoPincode] = useState('')
  const missingInfoModalContentRef = useRef<HTMLDivElement | null>(null)
  const missingInfoModalCloseButtonRef = useRef<HTMLButtonElement | null>(null)

  const closeRequestModal = () => {
    setShowRequestFormModal(false)
    setSelectedBookForRequest(null)
    resetForm()
    setActionType(null)
  }

  const closeMissingInfoModal = () => {
    setShowMissingInfoForm(false)
    setSelectedMatchForInfo(null)
  }

  useEffect(() => {
    const modalContent = showRequestFormModal
      ? requestModalContentRef.current
      : showMissingInfoForm
        ? missingInfoModalContentRef.current
        : null

    if (!modalContent) return

    const previouslyFocusedElement = document.activeElement as HTMLElement | null

    const focusInitial = () => {
      if (showRequestFormModal) {
        requestModalCloseButtonRef.current?.focus()
      } else if (showMissingInfoForm) {
        missingInfoModalCloseButtonRef.current?.focus()
      }
    }

    focusInitial()

    const getFocusableElements = () => {
      const elements = Array.from(
        modalContent.querySelectorAll<HTMLElement>(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
      )
      return elements.filter((el) => {
        const disabled = (el as HTMLButtonElement).disabled
        const ariaHidden = el.getAttribute('aria-hidden') === 'true'
        return !disabled && !ariaHidden
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (showRequestFormModal) closeRequestModal()
        if (showMissingInfoForm) closeMissingInfoModal()
        return
      }

      if (event.key !== 'Tab') return

      const focusables = getFocusableElements()
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (!active || active === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedElement?.focus?.()
    }
  }, [showRequestFormModal, showMissingInfoForm])

  const bookToCard = (book: BookResponse): Book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description || '',
    genre: book.genre || undefined,
    price: book.price || 0,
    image: book.imageUrl || undefined,
    thumbnail: book.thumbnailUrl || undefined,
    publisher: book.publisher || undefined,
    publicationYear: book.publicationYear || undefined,
    averageRating: book.averageRating || undefined,
    ratingsCount: book.ratingsCount || undefined,
  })

  // Load books for browsing
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setBooksLoading(true)
        setBooksError(null)
        const params: { search?: string; page?: number; size?: number } = {}
        
        const searchFromUrl = searchParams.get('search') || ''
        
        if (searchFromUrl.trim()) {
          params.search = searchFromUrl.trim()
        } else {
          params.page = 0
          params.size = 40
        }
        
        const data = await booksApi.list(params)
        const mappedBooks = data.map(bookToCard)
        setBooks(mappedBooks)
        setVisibleBooksCount(Math.min(20, mappedBooks.length))
      } catch (err) {
        setBooksError(err instanceof Error ? err.message : 'Failed to load books')
        console.error('Error fetching books:', err)
      } finally {
        setBooksLoading(false)
      }
    }

    fetchBooks()
  }, [searchParams])

  // Load requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRequestSearchQuery(requestSearchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [requestSearchQuery])

  useEffect(() => {
    loadRequests()
    if (user?.id) {
      loadMyRequests()
      loadUserProfile()
    }
  }, [user?.id, debouncedRequestSearchQuery])

  const loadRequests = async () => {
    try {
      setRequestsLoading(true)
      let data: BookRequestResponse[]
      if (debouncedRequestSearchQuery.trim()) {
        data = await demandApi.searchRequests(debouncedRequestSearchQuery.trim())
    } else {
        data = await demandApi.getOpenRequests()
      }
      setRequests(data)
    } catch (err: any) {
      showError(err.message || 'Failed to load listings')
    } finally {
      setRequestsLoading(false)
    }
  }

  const loadMyRequests = async () => {
    if (!user?.id) return
    try {
      const data = await demandApi.getMyRequests(user.id)
      setMyRequests(data)
    } catch (err: any) {
      console.error('Failed to load my listings:', err)
    }
  }

  const loadUserProfile = async () => {
    if (!user?.id) return
    try {
      const profile = await usersApi.getById(user.id)
      setUserProfile(profile)
    } catch (err) {
      console.error('Failed to load user profile:', err)
    }
  }

  const handleBookSelect = (book: BookResponse) => {
    setSelectedBookForRequest(book)
    setTitle(book.title)
    setAuthor(book.author || '')
    if (book.genre) setGenre(book.genre)
    if (book.category) setCategory(book.category)
    if (book.subcategory) setSubcategory(book.subcategory)
    if (book.isbn) setIsbn(book.isbn)
    if (book.description) setDescription(book.description)
    setActionType(null) // Reset action type when opening modal
    setShowRequestFormModal(true)
  }

  const handleAddToWishlist = async () => {
    if (!selectedBookForRequest || !user?.id) {
      showError('Please log in to add books to your wishlist')
      return
    }

    setIsSubmitting(true)
    try {
      await wishlistApi.addToWishlist(user.id, selectedBookForRequest.id)
      success(`"${selectedBookForRequest.title}" added to your wishlist!`)
      setShowRequestFormModal(false)
      setSelectedBookForRequest(null)
      resetForm()
      setActionType(null)
    } catch (err: any) {
      showError(err.message || 'Failed to add to wishlist')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !author.trim()) {
      showError('Title and author are required')
      return
    }
    
    if (!pincode.trim()) {
      showError('Pincode is required to find matches near you')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      let currentUserId = user?.id
      
      if (!user) {
        const tempEmail = `temp_${Date.now()}@arka.com`
        const tempPassword = `temp_${Math.random().toString(36).slice(2)}`
        const tempName = 'Guest User'
        
        await register({
          firstName: tempName,
          lastName: '',
          email: tempEmail,
          password: tempPassword,
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const storedUser = localStorage.getItem('arka_user')
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            currentUserId = parsedUser.id
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        if (!currentUserId) {
          showError('Failed to create account. Please try again.')
          setIsSubmitting(false)
          return
        }
      }
      
      const requestData: CreateBookRequestRequest = {
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || undefined,
        genre: genre.trim() || undefined,
        category: category.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        isbn: isbn.trim() || undefined,
        maxPrice: undefined,
        preferredCondition: preferredCondition !== 'ANY' ? preferredCondition : undefined,
        urgency: urgency || undefined,
        location: pincode.trim(),
        additionalNotes: additionalNotes.trim() || undefined,
      }
      
      if (!currentUserId) {
        showError('User ID is required. Please try again.')
        setIsSubmitting(false)
        return
      }
      
      const response: CreateRequestResponse = await demandApi.createRequest(currentUserId, requestData)
      
      setShowRequestFormModal(false)
      resetForm()
      setSelectedBookForRequest(null)
      
      if (response.matches && response.matches.length > 0) {
        setSubmittedMatches(response.matches)
        setSelectedRequestId(response.request.id)
        setShowMatchSelection(true)
    } else {
        success('Posted. We will let you know when there is a match.')
        loadRequests()
        loadMyRequests()
      }
    } catch (err: any) {
      showError(err.message || 'Failed to post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setAuthor('')
    setDescription('')
    setGenre('')
    setCategory('')
    setSubcategory('')
    setIsbn('')
    setPreferredCondition('ANY')
    setUrgency('MEDIUM')
    setPincode('')
    setAdditionalNotes('')
  }

  const handleSelectMatch = async (requestId: string, match: MatchResponse) => {
    if (!match.sellerId || !match.bookId) {
      showError('Invalid match data. Please try again.')
      return
    }

    const needsInfo = !user || !userProfile
    
    if (needsInfo) {
      setSelectedMatchForInfo({ requestId, match })
      setShowMissingInfoForm(true)
      
      if (user && userProfile) {
        if (userProfile.firstName && userProfile.lastName) {
          setMissingInfoName(`${userProfile.firstName} ${userProfile.lastName}`)
        }
        if (userProfile.email) {
          setMissingInfoEmail(userProfile.email)
        }
      }
      return
    }

    await proceedWithMatchSelection(requestId, match)
  }

  const proceedWithMatchSelection = async (requestId: string, match: MatchResponse) => {
    if (!user?.id) {
      showError('Please log in to select a match')
      return
    }

    try {
      await demandApi.fulfillRequest(requestId, match.sellerId, {
        bookId: match.bookId,
        offeredPrice: match.bookPrice,
        condition: 'GOOD',
        notes: `Selected from available matches`
      })
      
      success(`You chose "${match.bookTitle}" from ${match.sellerName}.`)
      
      setShowMatchSelection(false)
      setShowMissingInfoForm(false)
      setSubmittedMatches([])
      setSelectedRequestId(null)
      setSelectedMatchForInfo(null)
      
      loadRequests()
      loadMyRequests()
    } catch (err: any) {
      showError(err.message || 'Failed to select match')
    }
  }

  const handleMissingInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMatchForInfo) return
    
    setIsSubmitting(true)
    
    try {
      let currentUserId = user?.id
      
      if (!user) {
        if (!missingInfoName.trim() || !missingInfoEmail.trim() || !missingInfoPassword.trim()) {
          showError('Please fill in all required fields')
          setIsSubmitting(false)
          return
        }
        
        const nameParts = missingInfoName.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || firstName
        
        await register({
          firstName,
          lastName,
          email: missingInfoEmail.trim(),
          password: missingInfoPassword,
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const storedUser = localStorage.getItem('arka_user')
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            currentUserId = parsedUser.id
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        if (!currentUserId) {
          showError('Failed to create account. Please try again.')
          setIsSubmitting(false)
          return
        }
      }
      
      setShowMissingInfoForm(false)
      await proceedWithMatchSelection(selectedMatchForInfo.requestId, selectedMatchForInfo.match)
      
      setMissingInfoName('')
      setMissingInfoEmail('')
      setMissingInfoPassword('')
      setMissingInfoPhone('')
      setMissingInfoStreet('')
      setMissingInfoCity('')
      setMissingInfoState('')
      setMissingInfoPincode('')
      setSelectedMatchForInfo(null)
      
    } catch (err: any) {
      showError(err.message || 'Failed to save information')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkipMatchSelection = () => {
    setShowMatchSelection(false)
    setSubmittedMatches([])
    setSelectedRequestId(null)
    resetForm()
    loadRequests()
    loadMyRequests()
    success('Saved. You can pick a match later.')
  }

  const handleFulfill = (requestId: string) => {
    const r = [...requests, ...myRequests].find((x) => x.id === requestId)
    if (!r) {
      showError('Post not found.')
      return
    }
    const result = openContactRequesterEmail({ requesterEmail: r.requesterEmail, title: r.title })
    if (!result.ok) {
      showError('No email is available for this poster yet.')
      return
    }
    success('Opening your email app to contact them.')
  }

  const handleCancel = async (requestId: string) => {
    if (!confirm('Cancel this post?')) {
      return
    }

    if (!user?.id) return

    try {
      await demandApi.cancelRequest(requestId, user.id)
      success('Cancelled')
      loadRequests()
      loadMyRequests()
    } catch (err: any) {
      showError(err.message || 'Failed to cancel')
    }
  }

  const handleBookClick = (book: Book) => {
    trackBookView(book.id, 0)
    trackCartAdd(book.id)
    addToCart(book)
  }

  return (
    <div className={styles.marketplace}>
      {/* Pick Your Next Read - Search Bar Feature */}
      {!showMatchSelection && (
        <>
          <div className={styles.searchSection}>
            <div className={styles.searchContent}>
              <div className={styles.searchHeader}>
                <h2 className={styles.searchTitle}>Pick Your Next Read</h2>
                <p className={styles.searchSubtitle}>Let us know your next reads, and we'll bring it to you when ready.</p>
              </div>
            <div className={styles.searchBarWrapper}>
              <div className={styles.mainSearchInput}>
                <BookSearchInput
                  value={title}
                  onChange={setTitle}
                  onBookSelect={handleBookSelect}
                  placeholder="Search for a book by title, author, ISBN..."
              fullWidth
                />
              </div>
            </div>
            {/* Note: Genre/Subgenre filters are available in the header dropdown */}
            </div>
          </div>

          {/* My Wanted List Button - Below Search Section, Right Aligned */}
          {user && (
            <div className={styles.inQueueSection}>
              <div className={styles.container}>
                <Button
                  variant="primary"
                  onClick={() => {
                    const element = document.getElementById('my-wanted-list')
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className={styles.inQueueButton}
                >
                  <span className={styles.inQueueIcon}>📚</span>
                  <span className={styles.inQueueText}>
                    My Wanted List ({myRequests.length})
                  </span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Match Selection UI */}
      {showMatchSelection && submittedMatches.length > 0 && (
        <div className={styles.matchSelectionSection}>
          <div className={styles.matchSelectionHeader}>
            <div className={styles.matchCelebration}>
              <span>🎉</span>
              <span>✨</span>
              <span>🎊</span>
            </div>
            <h2 className={styles.matchSelectionTitle}>
              It's a Match!
            </h2>
            <p className={styles.matchSelectionSubtitle}>
              We found {submittedMatches.length} match{submittedMatches.length > 1 ? 'es' : ''} for what you are looking for. Pick one to continue.
            </p>
          </div>
          
          <div className={styles.matchesGrid}>
            {submittedMatches.map((match, index) => (
              <div key={match.bookId} className={styles.matchCard}>
                <div className={styles.matchCardHeader}>
                  <span className={styles.matchBadge}>
                    Match #{index + 1} • {Math.round(match.matchScore)}% Match
                  </span>
                </div>
                
                {match.bookImageUrl && (
                  <div className={styles.matchImage}>
                    <img src={match.bookImageUrl} alt={match.bookTitle} />
                  </div>
                )}
                
                <div className={styles.matchCardContent}>
                  <h3 className={styles.matchTitle}>{match.bookTitle}</h3>
                  <p className={styles.matchAuthor}>by {match.bookAuthor}</p>
                  
                  {match.bookGenre && (
                    <span className={styles.matchGenre}>{match.bookGenre}</span>
                  )}
                  
                  <div className={styles.matchPrice}>
                    <span className={styles.priceLabel}>Price:</span>
                    <span className={styles.priceValue}>₹{match.bookPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className={styles.matchSeller}>
                    <span className={styles.sellerLabel}>Seller:</span>
                    <span className={styles.sellerName}>{match.sellerName}</span>
                  </div>
                  
                  {match.matchReasons && match.matchReasons.length > 0 && (
                    <div className={styles.matchReasons}>
                      {match.matchReasons.slice(0, 3).map((reason, i) => (
                        <span key={i} className={styles.matchReasonTag}>{reason}</span>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (selectedRequestId) {
                        handleSelectMatch(selectedRequestId, match)
                      }
                    }}
                    className={styles.selectButton}
                  >
                    Select This Book
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.matchSelectionActions}>
            <Button variant="secondary" onClick={handleSkipMatchSelection}>
              Skip — decide later
            </Button>
          </div>
        </div>
      )}

      {/* Recommendations Section - Show when no search/filter */}
      {!searchQuery && !booksLoading && !showMatchSelection && (
        <>
          <RecommendationSection
            title="Recommended for You"
            type="personalized"
            limit={8}
          />
          <RecommendationSection
            title="Popular Books"
            type="popular"
            limit={8}
          />
        </>
      )}

      {/* Looking-for section */}
      {!showMatchSelection && (
        <div className={styles.content} id="community-gets">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>People are looking for</h2>
          </div>

          <div className={styles.searchBar}>
            <Input
              type="text"
              placeholder="Search by title, author, genre, ISBN…"
              value={requestSearchQuery}
              onChange={(e) => setRequestSearchQuery(e.target.value)}
              fullWidth
            />
          </div>

          {requestsLoading ? (
            <div className={styles.loading}>Loading…</div>
          ) : requests.length === 0 ? (
            <div className={styles.empty}>
              <p>No open posts yet. You can add one from a book you want.</p>
            </div>
          ) : (
            <div className={styles.requestsGrid}>
              {requests.map((request) => {
                const isRequestOwner = user?.id === request.requesterId
                return (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onFulfill={handleFulfill}
                    onCancel={handleCancel}
                  isOwner={isRequestOwner}
                  onSelectMatch={handleSelectMatch}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Book Listings */}
      {!showMatchSelection && (
      <section className={styles.listingsSection}>
        <div className={styles.container}>
            {booksLoading && (
            <div className={styles.loading}>
              <p>Loading books... this can take a few seconds.</p>
            </div>
          )}
          
            {booksError && (
            <div className={styles.error}>
                <p>Error: {booksError}</p>
            </div>
          )}
          
            {!booksLoading && !booksError && books.length === 0 && (
            <div className={styles.empty}>
                <p>
                  {searchQuery
                    ? 'No books matched your search. Try a different title or clear the search.'
                    : 'No books are available right now. If this seems incorrect, refresh in a few seconds.'}
                </p>
            </div>
          )}
          
            {!booksLoading && !booksError && books.length > 0 && (
            <>
              <div className={styles.resultsInfo}>
                <p>Found {books.length} book{books.length !== 1 ? 's' : ''}</p>
              </div>
              <div className={styles.booksGrid}>
                {books.slice(0, visibleBooksCount).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onButtonClick={handleBookClick}
                      buttonText="Add to cart"
                  />
                ))}
              </div>
              {visibleBooksCount < books.length && (
                <div style={{ marginTop: 16, display: 'grid', placeItems: 'center' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setVisibleBooksCount((prev) => Math.min(prev + 20, books.length))}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      )}

      {/* Get Form Modal */}
      {showRequestFormModal && selectedBookForRequest && (
        <div className={styles.requestFormModal} role="presentation">
          <div
            className={styles.requestFormModalContent}
            ref={requestModalContentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`request-modal-title-${reactId}`}
          >
            <div className={styles.requestFormModalHeader}>
              <h2 className={styles.requestFormModalTitle} id={`request-modal-title-${reactId}`}>
                "{selectedBookForRequest.title}"
              </h2>
              <p className={styles.requestFormModalSubtitle}>
                Choose how you'd like to proceed with this book
              </p>
              <button
                ref={requestModalCloseButtonRef}
                type="button"
                className={styles.requestFormModalClose}
                aria-label="Close dialog"
                onClick={closeRequestModal}
              >
                ×
              </button>
            </div>
            
            {/* Action Selection */}
            {!actionType && (
              <div className={styles.actionSelection}>
                <div className={styles.actionButtons}>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setActionType('wishlist')}
                    className={styles.actionButton}
                  >
                    <span className={styles.actionIcon}>⭐</span>
                    <div className={styles.actionContent}>
                      <span className={styles.actionTitle}>Add to Wishlist</span>
                      <span className={styles.actionDescription}>Save for later reading</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setActionType('match')}
                    className={styles.actionButton}
                  >
                    <span className={styles.actionIcon}>🔍</span>
                    <div className={styles.actionContent}>
                      <span className={styles.actionTitle}>Post what you are looking for</span>
                      <span className={styles.actionDescription}>Same as any listing — just the other direction</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Wishlist Action */}
            {actionType === 'wishlist' && (
              <div className={styles.actionForm}>
                <div className={styles.actionFormHeader}>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => setActionType(null)}
                  >
                    ← Back
                  </button>
                  <h3 className={styles.actionFormTitle}>Add to Wishlist</h3>
                </div>
                <p className={styles.actionFormDescription}>
                  Save "{selectedBookForRequest.title}" to your wishlist for future reading.
                </p>
                <div className={styles.requestFormActions}>
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={handleAddToWishlist}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add to Wishlist'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setShowRequestFormModal(false)
                      setSelectedBookForRequest(null)
                      resetForm()
                      setActionType(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Match Request Form */}
            {actionType === 'match' && (
            <form onSubmit={handleRequestFormSubmit} className={styles.requestFormModalForm}>
              <div className={styles.actionFormHeader}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => setActionType(null)}
                >
                  ← Back
                </button>
                <h3 className={styles.actionFormTitle}>Create Match Request</h3>
              </div>
              <p className={styles.actionFormDescription}>
                Fill in the details below and we'll find this book for you.
              </p>
              <div className={styles.requestSection}>
                <div className={styles.formRow}>
                  <Input
                    label="Title *"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    fullWidth
                  />
                  <Input
                    label="Author *"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor={`request-description-${reactId}`}>
                    Description
                  </label>
                  <textarea
                    id={`request-description-${reactId}`}
                    className={styles.textarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the book you're looking for..."
                  />
                </div>
                
                <div className={styles.formRow}>
                  <Input
                    label="Genre"
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="ISBN (Optional)"
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    fullWidth
                  />
                </div>
                
                <div className={styles.formRow}>
                  <Select
                    label="Preferred Condition"
                    options={[
                      { value: 'ANY', label: 'Any Condition' },
                      { value: 'NEW', label: 'New' },
                      { value: 'LIKE_NEW', label: 'Like New' },
                      { value: 'GOOD', label: 'Good' },
                      { value: 'FAIR', label: 'Fair' },
                    ]}
                    value={preferredCondition}
                    onChange={(e) => setPreferredCondition(e.target.value)}
                    fullWidth
                  />
                </div>
                
                <div className={styles.formRow}>
                  <Select
                    label="Urgency"
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' },
                    ]}
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Pincode *"
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="400001"
                    required
                    fullWidth
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor={`request-additional-notes-${reactId}`}>
                    Additional Notes
                  </label>
                  <textarea
                    id={`request-additional-notes-${reactId}`}
                    className={styles.textarea}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={2}
                    placeholder="Any additional information..."
                  />
                </div>
              </div>
              
              <div className={styles.requestFormActions}>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Getting...' : 'Get'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                      closeRequestModal()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Missing Info Form Modal */}
      {showMissingInfoForm && selectedMatchForInfo && (
        <div className={styles.requestFormModal} role="presentation">
          <div
            className={styles.requestFormModalContent}
            ref={missingInfoModalContentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`missing-info-modal-title-${reactId}`}
          >
            <div className={styles.requestFormModalHeader}>
              <h2 className={styles.requestFormModalTitle} id={`missing-info-modal-title-${reactId}`}>
                Complete Your Information
              </h2>
              <p className={styles.requestFormModalSubtitle}>
                We need a few details to complete your exchange/purchase of "{selectedMatchForInfo.match.bookTitle}"
              </p>
              <button
                ref={missingInfoModalCloseButtonRef}
                type="button"
                className={styles.requestFormModalClose}
                aria-label="Close dialog"
                onClick={closeMissingInfoModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleMissingInfoSubmit} className={styles.requestFormModalForm}>
              <div className={styles.accountSection}>
                <h3 className={styles.sectionTitle}>Your Information</h3>
                {!user && (
                  <>
                    <div className={styles.formRow}>
                      <Input
                        label="Full Name *"
                        type="text"
                        value={missingInfoName}
                        onChange={(e) => setMissingInfoName(e.target.value)}
                        placeholder="John Doe"
                        required
                        fullWidth
                      />
                      <Input
                        label="Email *"
                        type="email"
                        value={missingInfoEmail}
                        onChange={(e) => setMissingInfoEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        fullWidth
                      />
                    </div>
                    <div className={styles.formRow}>
                      <Input
                        label="Password *"
                        type="password"
                        value={missingInfoPassword}
                        onChange={(e) => setMissingInfoPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        fullWidth
                      />
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={missingInfoPhone}
                        onChange={(e) => setMissingInfoPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        fullWidth
                      />
                    </div>
                  </>
                )}
                {user && (
                  <div className={styles.formRow}>
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={missingInfoPhone}
                      onChange={(e) => setMissingInfoPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      fullWidth
                    />
                  </div>
                )}
              </div>
              
              <div className={styles.addressSection}>
                <h3 className={styles.sectionTitle}>Delivery Address</h3>
                <Input
                  label="Street Address"
                  type="text"
                  value={missingInfoStreet}
                  onChange={(e) => setMissingInfoStreet(e.target.value)}
                  placeholder="123 Main Street"
                  fullWidth
                />
                <div className={styles.formRow}>
                  <Input
                    label="City"
                    type="text"
                    value={missingInfoCity}
                    onChange={(e) => setMissingInfoCity(e.target.value)}
                    placeholder="Mumbai"
                    fullWidth
                  />
                  <Input
                    label="State"
                    type="text"
                    value={missingInfoState}
                    onChange={(e) => setMissingInfoState(e.target.value)}
                    placeholder="Maharashtra"
                    fullWidth
                  />
                </div>
                <Input
                  label="Pincode"
                  type="text"
                  value={missingInfoPincode}
                  onChange={(e) => setMissingInfoPincode(e.target.value)}
                  placeholder="400001"
                  fullWidth
                />
              </div>
              
              <div className={styles.requestFormActions}>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Complete & Proceed'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowMissingInfoForm(false)
                    setSelectedMatchForInfo(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recently Served Carousel */}
      {!showMatchSelection && (
        <RecentlyServedCarousel limit={10} />
      )}
    </div>
  )
}

export default BooksMarketplace
