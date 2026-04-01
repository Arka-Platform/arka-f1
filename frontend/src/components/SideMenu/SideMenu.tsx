/* Left-rail navigation only (single menu). */
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import styles from './SideMenu.module.css'

const RailIcon = ({ children }: { children: React.ReactNode }) => (
  <span className={styles.railIcon} aria-hidden>
    {children}
  </span>
)

function initials(firstName?: string, lastName?: string, email?: string | null) {
  const a = (firstName ?? '').trim()
  const b = (lastName ?? '').trim()
  if (a || b) return `${a.slice(0, 1)}${b.slice(0, 1)}`.toUpperCase()
  const e = (email ?? '').trim()
  if (e) return e.slice(0, 1).toUpperCase()
  return 'A'
}

export default function SideMenu() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const profile = useMemo(() => {
    const name =
      isAuthenticated && user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || (user.email ?? 'Account')
        : 'Guest'
    const email = isAuthenticated && user ? user.email ?? '' : 'Sign in to sync'
    const avatar = initials(user?.firstName, user?.lastName, user?.email ?? null)
    return { name, email, avatar }
  }, [isAuthenticated, user])

  const rail = useMemo(
    () => [
      { href: '/home', label: 'Home', icon: <RailIcon>🏠</RailIcon> },
      { href: '/books', label: 'Browse', icon: <RailIcon>📚</RailIcon> },
      { href: '/inventory', label: 'Pass', icon: <RailIcon>📤</RailIcon> },
      { href: '/requests', label: 'Requests', icon: <RailIcon>🔎</RailIcon> },
      { href: '/community', label: 'Community', icon: <RailIcon>🫂</RailIcon> },
    ],
    []
  )

  return (
    <>
      <nav className={styles.rail} aria-label="Primary">
        <div className={styles.railTop} aria-label="Profile">
          <div className={styles.railAvatar} aria-hidden>
            {profile.avatar}
          </div>
        </div>
        <div className={styles.railLinks}>
          {rail.map((r) => {
            const active = pathname === r.href || pathname.startsWith(r.href + '/')
            return (
              <Link
                key={r.href}
                href={r.href}
                className={`${styles.railLink} ${active ? styles.railLinkActive : ''}`}
                aria-label={r.label}
              >
                {r.icon}
              </Link>
            )
          })}
        </div>
        <div className={styles.railBottom}>
          <button type="button" className={styles.railLink} aria-label="Toggle theme" onClick={toggleTheme}>
            <RailIcon>{theme === 'home' ? '☾' : '☀︎'}</RailIcon>
          </button>
        </div>
      </nav>
    </>
  )
}

