import React from 'react'
import styles from './CircleHub.module.css'
import Button from '../../shared/Button/Button'

interface ReadingCircle {
  id: string
  name: string
  description: string
  host: string
  members: number
  activeChains: number
  streakDays: number
  tags: string[]
  badge: string
}

const circleData: ReadingCircle[] = [
  {
    id: 'south-asian-lit',
    name: 'South Asian Lit Relay',
    description:
      'Hyper-curated swaps of contemporary fiction, translated classics, and diaspora voices across India, Pakistan, Sri Lanka, and Bangladesh.',
    host: 'Anika Bhattacharya',
    members: 214,
    activeChains: 18,
    streakDays: 42,
    tags: ['Fiction', 'Translation', 'Diaspora'],
    badge: 'SA',
  },
  {
    id: 'climate-collective',
    name: 'Climate Collective',
    description:
      'A circular shelf for climate nonfiction, regenerative design, and optimistic futurism—paired with quarterly micro-salons.',
    host: 'Emmanuel Nwosu',
    members: 168,
    activeChains: 11,
    streakDays: 29,
    tags: ['Climate', 'Design', 'Policy'],
    badge: 'CC',
  },
  {
    id: 'moonlight-club',
    name: 'Moonlight Club',
    description:
      'Late-night readers trading literary thrillers & speculative mysteries with a 7-day cadence to keep the suspense alive.',
    host: 'Maya Ortiz',
    members: 132,
    activeChains: 9,
    streakDays: 17,
    tags: ['Thriller', 'Speculative', 'Night Owls'],
    badge: 'MC',
  },
  {
    id: 'tiny-hands',
    name: 'Tiny Hands Exchange',
    description:
      'Parents and caregivers swapping STEM-forward picture books, Montessori kits, and tactile storyboards for ages 3-8.',
    host: 'Jerome Lee',
    members: 95,
    activeChains: 7,
    streakDays: 21,
    tags: ['Kids', 'STEM', 'Montessori'],
    badge: 'TH',
  },
]

const CircleHub: React.FC = () => {
  return (
    <section className={styles.circleSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>Community Exchange</span>
        <h2 className={styles.sectionTitle}>Circles as Hubs</h2>
        <p className={styles.sectionSubtitle}>
          Join dedicated reading circles that keep the exchange chain alive. Each hub curates genres,
          nurtures streaks, and gives you transparent insight into what&apos;s moving next.
        </p>
      </div>

      <div className={styles.circlesGrid}>
        {circleData.map((circle) => (
          <article key={circle.id} className={styles.circleCard}>
            <div className={styles.circleHeader}>
              <div className={styles.circleBadge}>{circle.badge}</div>
              <div>
                <h3 className={styles.circleName}>{circle.name}</h3>
                <p className={styles.circleHost}>Hosted by {circle.host}</p>
              </div>
            </div>

            <p className={styles.circleDescription}>{circle.description}</p>

            <div className={styles.metricsRow}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Members</span>
                <div className={styles.metricValue}>{circle.members}</div>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Active Chains</span>
                <div className={styles.metricValue}>{circle.activeChains}</div>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Streak</span>
                <div className={styles.metricValue}>{circle.streakDays}d</div>
              </div>
            </div>

            <div className={styles.tagsRow}>
              {circle.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>

            <div className={styles.circleFooter}>
              <span className={styles.streakPill}>
                🔥 Chain alive for {circle.streakDays} days
              </span>
              <Button variant="secondary" onClick={() => {}}>
                View Circle
              </Button>
            </div>

            <button className={styles.ghostButton} type="button" onClick={() => {}}>
              See live shelf
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default CircleHub












