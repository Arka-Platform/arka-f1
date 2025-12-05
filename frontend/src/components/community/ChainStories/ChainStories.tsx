import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ChainStories.module.css'
import Button from '../../shared/Button/Button'
import { communityApi, ChainStoryResponse } from '../../../utils/api'
import { useToast } from '../../../contexts/ToastContext'

const ChainStories: React.FC = () => {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [stories, setStories] = useState<ChainStoryResponse[]>([])
  const [selectedStory, setSelectedStory] = useState<ChainStoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChains = async () => {
      try {
        setLoading(true)
        const data = await communityApi.getChains()
        setStories(data)
        if (data.length > 0) {
          setSelectedStory(data[0])
        }
      } catch (error: any) {
        console.error('Error loading chains:', error)
        showError('Failed to load chain stories. Please try again later.')
        // Set empty array on error to show empty state
        setStories([])
      } finally {
        setLoading(false)
      }
    }
    loadChains()
  }, [showError])

  const handlePingChain = async (chainId: string) => {
    try {
      await communityApi.pingChain(chainId)
      success('Chain pinged successfully!')
      // Reload chains to get updated data
      const data = await communityApi.getChains()
      setStories(data)
      // Update selected story if it's the one we pinged
      if (selectedStory?.id === chainId) {
        const updated = data.find(s => s.id === chainId)
        if (updated) {
          setSelectedStory(updated)
        }
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to ping chain')
      console.error('Error pinging chain:', error)
    }
  }

  const handleKeepAlive = async (chainId: string) => {
    try {
      await communityApi.keepChainAlive(chainId)
      success('Chain kept alive!')
      // Reload chains to get updated data
      const data = await communityApi.getChains()
      setStories(data)
      // Update selected story if it's the one we kept alive
      if (selectedStory?.id === chainId) {
        const updated = data.find(s => s.id === chainId)
        if (updated) {
          setSelectedStory(updated)
        }
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to keep chain alive')
      console.error('Error keeping chain alive:', error)
    }
  }

  const orderedParticipants = useMemo(() => {
    if (!selectedStory) return []
    return selectedStory.participants || []
  }, [selectedStory])

  if (loading) {
    return (
      <section className={styles.storiesSection}>
        <div className={styles.storiesHeader}>
          <div>
            <h2 className={styles.storiesTitle}>Chain Stories</h2>
            <p className={styles.storiesSubtitle}>Loading chains...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.storiesSection}>
      <div>
        <div className={styles.storiesHeader}>
          <div>
            <h2 className={styles.storiesTitle}>Chain Stories</h2>
            <p className={styles.storiesSubtitle}>
              Tap into live exchange streaks. Every story shows how a book is moving through the
              community, story-style.
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => {
              // Navigate to books marketplace to start a chain
              navigate('/books')
            }}
          >
            Start a Chain
          </Button>
        </div>

        <div className={styles.scrollArea}>
          {stories.length === 0 && !loading ? (
            <div className={styles.emptyState}>
              <p>No chains available. Start a chain by sharing a book!</p>
            </div>
          ) : (
            stories.map((story) => (
            <article
              key={story.id}
              className={styles.storyCard}
              style={{
                background: `linear-gradient(135deg, rgba(16,185,129,0.8), rgba(5,150,105,0.6)), url('https://picsum.photos/seed/${story.id}/400/600') center/cover`,
              }}
              onClick={() => setSelectedStory(story)}
            >
              <span className={styles.chainBadge}>{story.chainBadge}</span>
              <div className={styles.storyGradient} />
              <div className={styles.storyContent}>
                <p className={styles.storyTitle}>{story.title}</p>
                <p className={styles.storyMeta}>{story.lastHop}</p>
                <button 
                  className={styles.storyButton} 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedStory(story)
                  }}
                >
                  View chain
                </button>
              </div>
            </article>
            ))
          )}
        </div>
      </div>

      {selectedStory && (
        <div className={styles.selectedStory}>
          <div>
            <div className={styles.selectedHeader}>
              <div>
                <h3 className={styles.selectedTitle}>{selectedStory.title}</h3>
                <p className={styles.selectedMeta}>
                  {selectedStory.chainBadge} · {selectedStory.lastHop}
                </p>
              </div>
              <div className={styles.streakBadge}>
                🔥 {selectedStory.streakDays}-day streak intact
              </div>
            </div>

            <div className={styles.participantsList}>
              {orderedParticipants.map((participant) => (
                <div key={participant.name} className={styles.participantRow}>
                  <div>
                    <div className={styles.participantName}>{participant.name}</div>
                    <div className={styles.participantLocation}>{participant.location}</div>
                  </div>
                  <span>{participant.handoff}</span>
                </div>
              ))}
            </div>

            <div className={styles.actionArea}>
              <Button variant="secondary" onClick={() => handlePingChain(selectedStory.id)}>
                Ping Chain
              </Button>
              <Button variant="primary" onClick={() => handleKeepAlive(selectedStory.id)}>
                Keep Chain Alive
              </Button>
            </div>
          </div>

          <div className={styles.coverMock}>
            <span>{selectedStory.coverLabel}</span>
          </div>
        </div>
      )}
    </section>
  )
}

export default ChainStories












