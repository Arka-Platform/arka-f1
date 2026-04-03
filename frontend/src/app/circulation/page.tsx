import Image from 'next/image'
import { Playfair_Display, Inter } from 'next/font/google'
import { Flame, Camera, Star, Users, ChevronDown, ChevronRight } from 'lucide-react'
import styles from './circulation.module.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-circ-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-circ-sans',
  display: 'swap',
})

const IMG_PROPHET = 'https://covers.openlibrary.org/b/isbn/9780394404288-L.jpg'
const IMG_MIDNIGHT = 'https://m.media-amazon.com/images/I/81Y6jqg5QxL.jpg'
const IMG_SAPIENS = 'https://m.media-amazon.com/images/I/713jIoMO3UL.jpg'

const AVATAR_ROHAN = 'https://i.pravatar.cc/80?img=12'
const AVATAR_MEERA = 'https://i.pravatar.cc/80?img=45'

export default function CirculationPage() {
  return (
    <div className={`${playfair.variable} ${inter.variable} ${styles.page}`}>
      <div className={styles.pageInner}>
        <div className={styles.row} role="list">
          {/* Card 1 — The Prophet */}
          <article className={`${styles.card} ${styles.cardLeft}`} role="listitem">
            <div className={styles.imageWrap}>
              <span className={styles.badgeNear}>Near you</span>
              <button type="button" className={styles.chevronBtn} aria-label="More options">
                <ChevronDown size={16} strokeWidth={1.75} />
              </button>
              <Image
                src={IMG_PROPHET}
                alt="The Prophet by Kahlil Gibran — book cover"
                fill
                className={styles.imageFill}
                sizes="280px"
                priority
              />
            </div>
            <h2 className={styles.titleSerif}>The Prophet</h2>
            <p className={styles.author}>Kahlil Gibran</p>
            <div className={styles.tags}>
              <span className={styles.tag}>Fiction</span>
              <span className={styles.tag}>Classic</span>
            </div>
            <p className={styles.offered}>Offered by Ananya S.</p>
            <div className={styles.stackSm}>
              <div className={styles.statLine}>
                <Camera size={14} strokeWidth={1.5} className={styles.iconMuted} aria-hidden />
                <span>85</span>
              </div>
              <div className={styles.statLine}>
                <Users size={14} strokeWidth={1.5} className={styles.iconMuted} aria-hidden />
                <span>23 circulations</span>
              </div>
            </div>
          </article>

          {/* Card 2 — The Midnight Library (featured) */}
          <article className={`${styles.card} ${styles.cardCenter}`} role="listitem">
            <div className={styles.requestsRow}>
              <Flame size={15} strokeWidth={1.75} className={styles.flameIcon} fill="currentColor" aria-hidden />
              <span>12 requests</span>
            </div>
            <div className={styles.imageWrap}>
              <Image
                src={IMG_MIDNIGHT}
                alt="The Midnight Library by Matt Haig — book cover"
                fill
                className={styles.imageFill}
                sizes="340px"
              />
            </div>
            <h2 className={styles.titleSerif}>The Midnight Library</h2>
            <p className={styles.author}>Matt Haig</p>
            <div className={styles.tags}>
              <span className={`${styles.tag} ${styles.tagLight}`}>Fiction</span>
              <span className={`${styles.tag} ${styles.tagLight}`}>Good Condition</span>
            </div>
            <div className={styles.starRow}>
              <Star size={15} strokeWidth={1.5} className={styles.starIcon} fill="currentColor" aria-hidden />
              <span>4.4</span>
              <span className={styles.circulations}>34 circulations</span>
            </div>
            <div className={styles.footerRow}>
              <div className={styles.footerLeft}>
                <Image
                  src={AVATAR_ROHAN}
                  alt=""
                  width={36}
                  height={36}
                  className={styles.avatar}
                />
                <p className={styles.offeredStrong}>
                  Offered by <strong>Rohan</strong>
                </p>
              </div>
              <div className={styles.footerMeta}>
                <span className={styles.camCount}>
                  <Camera size={14} strokeWidth={1.5} className={styles.iconMuted} aria-hidden />
                  92
                </span>
                <ChevronRight size={18} strokeWidth={1.5} className={styles.chevronRight} aria-hidden />
              </div>
            </div>
          </article>

          {/* Card 3 — Sapiens */}
          <article className={`${styles.card} ${styles.cardRight}`} role="listitem">
            <div className={styles.imageWrap}>
              <span className={styles.badgeTrending}>Trending</span>
              <Image
                src={IMG_SAPIENS}
                alt="Sapiens by Yuval Noah Harari — book cover"
                fill
                className={styles.imageFill}
                sizes="280px"
              />
            </div>
            <h2 className={styles.titleSerif}>Sapiens</h2>
            <p className={styles.subtitleCaps}>A brief history of humankind</p>
            <p className={styles.authorLight}>Yuval Noah Harari</p>
            <div className={styles.tags}>
              <span className={`${styles.tag} ${styles.tagPink}`}>Non-Fiction</span>
              <span className={`${styles.tag} ${styles.tagPink}`}>Like New</span>
            </div>
            <div className={styles.starRow}>
              <Star size={15} strokeWidth={1.5} className={styles.starIcon} fill="currentColor" aria-hidden />
              <span>4.7</span>
              <span className={styles.circulations}>51 circulations</span>
            </div>
            <div className={styles.footerRow}>
              <div className={styles.footerLeft}>
                <Image
                  src={AVATAR_MEERA}
                  alt=""
                  width={36}
                  height={36}
                  className={styles.avatar}
                />
                <p className={styles.offeredStrong}>
                  Offered by <strong>Meera</strong>
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
