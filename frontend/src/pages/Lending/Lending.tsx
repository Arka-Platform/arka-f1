import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { lendingApi, LendingResponse } from '../../utils/api'
import { useToast } from '../../contexts/ToastContext'
import Button from '../../components/shared/Button/Button'
import styles from './Lending.module.css'

const Lending: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [lendings, setLendings] = useState<LendingResponse[]>([])
  const [activeLendings, setActiveLendings] = useState<LendingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'requests'>('all')

  useEffect(() => {
    if (user?.id) {
      loadLendings()
    }
  }, [user?.id])

  const loadLendings = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const [all, active] = await Promise.all([
        lendingApi.getUserLendings(user.id),
        lendingApi.getActiveLendings(user.id)
      ])
      setLendings(all)
      setActiveLendings(active)
    } catch (error) {
      showError('Failed to load lendings')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (lendingId: string) => {
    if (!user?.id) return
    
    try {
      await lendingApi.approve(lendingId, user.id)
      success('Lending request approved')
      loadLendings()
    } catch (error) {
      showError('Failed to approve lending')
    }
  }

  const handleReject = async (lendingId: string, reason?: string) => {
    if (!user?.id) return
    
    try {
      await lendingApi.reject(lendingId, user.id, reason)
      success('Lending request rejected')
      loadLendings()
    } catch (error) {
      showError('Failed to reject lending')
    }
  }

  const handleStart = async (lendingId: string) => {
    if (!user?.id) return
    
    try {
      await lendingApi.start(lendingId, user.id)
      success('Lending started')
      loadLendings()
    } catch (error) {
      showError('Failed to start lending')
    }
  }

  const handleReturn = async (lendingId: string) => {
    if (!user?.id) return
    
    try {
      await lendingApi.return(lendingId, user.id)
      success('Book returned successfully')
      loadLendings()
    } catch (error) {
      showError('Failed to return book')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ffa500'
      case 'APPROVED': return '#2196F3'
      case 'ACTIVE': return '#4CAF50'
      case 'RETURNED': return '#9E9E9E'
      case 'REJECTED': return '#f44336'
      case 'CANCELLED': return '#f44336'
      case 'OVERDUE': return '#f44336'
      default: return '#757575'
    }
  }

  const filteredLendings = activeTab === 'active' 
    ? activeLendings 
    : activeTab === 'requests'
    ? lendings.filter(l => l.status === 'PENDING' && l.ownerId === user?.id)
    : lendings

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Book Lending</h1>
      
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Lendings
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activeLendings.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
      </div>

      {filteredLendings.length === 0 ? (
        <div className={styles.empty}>No lendings found</div>
      ) : (
        <div className={styles.lendingsList}>
          {filteredLendings.map((lending) => (
            <div key={lending.id} className={styles.lendingCard}>
              <div className={styles.lendingHeader}>
                <div>
                  <h3>{lending.bookTitle}</h3>
                  <p className={styles.author}>by {lending.bookAuthor}</p>
                </div>
                <span
                  className={styles.status}
                  style={{ backgroundColor: getStatusColor(lending.status) }}
                >
                  {lending.status}
                </span>
              </div>

              <div className={styles.lendingDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Owner:</span>
                  <span>{lending.ownerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Borrower:</span>
                  <span>{lending.borrowerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Requested:</span>
                  <span>{new Date(lending.requestedAt).toLocaleDateString()}</span>
                </div>
                {lending.expectedReturnDate && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Expected Return:</span>
                    <span>{new Date(lending.expectedReturnDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.label}>Lending Fee:</span>
                  <span>{lending.lendingFee} credits</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Deposit:</span>
                  <span>{lending.deposit} credits</span>
                </div>
              </div>

              {lending.notes && (
                <div className={styles.notes}>
                  <strong>Notes:</strong> {lending.notes}
                </div>
              )}

              <div className={styles.actions}>
                {lending.status === 'PENDING' && lending.ownerId === user?.id && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(lending.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleReject(lending.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {lending.status === 'APPROVED' && lending.ownerId === user?.id && (
                  <Button
                    variant="primary"
                    onClick={() => handleStart(lending.id)}
                  >
                    Start Lending
                  </Button>
                )}
                {lending.status === 'ACTIVE' && lending.borrowerId === user?.id && (
                  <Button
                    variant="primary"
                    onClick={() => handleReturn(lending.id)}
                  >
                    Return Book
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Lending



