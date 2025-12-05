import React, { useMemo, useState } from 'react'
import styles from './ChainStories.module.css'
import Button from '../../shared/Button/Button'

interface ChainStory {
  id: string
  title: string
  chainBadge: string
  coverLabel: string
  streakDays: number
  hops: number
  lastHop: string
  participants: Array<{
    name: string
    location: string
    handoff: string
  }>
}

const stories: ChainStory[] = [
  {
    id: 'saffron-summer',
    title: 'A Saffron Summer',
    chainBadge: 'Chain · 12 hops',
    coverLabel: 'Poetry Relay',
    streakDays: 48,
    hops: 12,
    lastHop: 'Bangalore → Kochi · 36h ago',
    participants: [
      { name: 'Anika Bhattacharya', location: 'Kolkata', handoff: 'sent to Maya' },
      { name: 'Maya Ortiz', location: 'Dubai', handoff: 'sent to Aarav' },
      { name: 'Aarav Menon', location: 'Bangalore', handoff: 'sent to Lila' },
    ],
  },
  {
    id: 'biosphere',
    title: 'Designing a Biosphere',
    chainBadge: 'Chain · 9 hops',
    coverLabel: 'Climate Circle',
    streakDays: 32,
    hops: 9,
    lastHop: 'Berlin → Amsterdam · 5h ago',
    participants: [
      { name: 'Emmanuel Nwosu', location: 'Lagos', handoff: 'sent to Teresa' },
      { name: 'Teresa van Dijk', location: 'Amsterdam', handoff: 'sent to Ivo' },
      { name: 'Ivo Marques', location: 'Lisbon', handoff: 'sent to Robin' },
    ],
  },
  {
    id: 'paper-scholars',
    title: 'Paper Scholars',
    chainBadge: 'Chain · 15 hops',
    coverLabel: 'Parent Relay',
    streakDays: 61,
    hops: 15,
    lastHop: 'Chennai → Pune · 2d ago',
    participants: [
      { name: 'Jerome Lee', location: 'Singapore', handoff: 'sent to Priya' },
      { name: 'Priya Deshmukh', location: 'Pune', handoff: 'sent to Tessa' },
      { name: 'Tessa Ruíz', location: 'Madrid', handoff: 'Up next' },
    ],
  },
]

const ChainStories: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<ChainStory | null>(stories[0])

  const orderedParticipants = useMemo(() => {
    if (!selectedStory) return []
    return selectedStory.participants
  }, [selectedStory])

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
          <Button variant="primary" onClick={() => {}}>
            Start a Chain
          </Button>
        </div>

        <div className={styles.scrollArea}>
          {stories.map((story) => (
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
                <button className={styles.storyButton} type="button">
                  View chain
                </button>
              </div>
            </article>
          ))}
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
              <Button variant="secondary" onClick={() => {}}>
                Ping Chain
              </Button>
              <Button variant="primary" onClick={() => {}}>
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












