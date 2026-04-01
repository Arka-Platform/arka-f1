'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import styles from './SideMenu.module.css'

type MenuItem = {
  id: string
  label: string
  href: string
  badge?: number
  icon: React.ReactNode
}

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
  const [mobileOpen, setMobileOpen] = useState(false)

  const profile = useMemo(() => {
    const name =
      isAuthenticated && user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || (user.email ?? 'Account')
        : 'Guest'
    const email = isAuthenticated && user ? user.email ?? '' : 'Sign in to sync'
    const avatar = initials(user?.firstName, user?.lastName, user?.email ?? null)
    return { name, email, avatar }
  }, [isAuthenticated, user])

  const items: MenuItem[] = useMemo(
    () => [
      {
        id: 'calendar',
        label: 'Calendar',
        href: '/orders',
        badge: 2,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v4M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18" />
          </svg>
        ),
      },
      {
        id: 'rewards',
        label: 'Rewards',
        href: '/analytics',
        badge: 2,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.5 6.5L21 9l-5 4 1.5 7L12 17l-5.5 3 1.5-7-5-4 6.5-.5L12 2z" />
          </svg>
        ),
      },
      {
        id: 'address',
        label: 'Address',
        href: '/preferences',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        ),
      },
      {
        id: 'payments',
        label: 'Payment Methods',
        href: '/account',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2.5" y="5" width="19" height="14" rx="2" />
            <path d="M2.5 9h19" />
            <path d="M6.5 15h4" />
          </svg>
        ),
      },
      {
        id: 'offers',
        label: 'Offers',
        href: '/inventory',
        badge: 2,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.5 7.5l-8 8-4-4" />
            <path d="M7 3h10l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          </svg>
        ),
      },
      {
        id: 'refer',
        label: 'Refer a Friend',
        href: '/community',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z" />
            <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3z" />
            <path d="M8 13c-2.67 0-8 1.34-8 4v2h10" />
            <path d="M16 13c-1.2 0-2.5.2-3.7.55" />
            <path d="M18 15v6" />
            <path d="M15 18h6" />
          </svg>
        ),
      },
      {
        id: 'support',
        label: 'Support',
        href: '/contact',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16v12H5.5L4 17.5V4z" />
            <path d="M8 9h8" />
            <path d="M8 12h6" />
          </svg>
        ),
      },
    ],
    []
  )

  const rail = useMemo(
    () => [
      { href: '/account', label: 'Account', icon: <RailIcon>👤</RailIcon> },
      { href: '/books', label: 'Browse', icon: <RailIcon>📚</RailIcon> },
      { href: '/requests', label: 'Requests', icon: <RailIcon>🔎</RailIcon> },
      { href: '/community', label: 'Community', icon: <RailIcon>🫂</RailIcon> },
      { href: '/preferences', label: 'Settings', icon: <RailIcon>⚙️</RailIcon> },
    ],
    []
  )

  const renderPanel = (mode: 'desktop' | 'mobile') => (
    <aside className={mode === 'desktop' ? styles.panel : styles.panelMobile} aria-label="Menu">
      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden>
          {profile.avatar}
        </div>
        <div className={styles.profileText}>
          <div className={styles.profileName}>{profile.name}</div>
          <div className={styles.profileEmail}>{profile.email}</div>
        </div>
        {mode === 'mobile' && (
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        )}
      </div>

      <nav className={styles.menuList} aria-label="Account menu">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
              onClick={() => mode === 'mobile' && setMobileOpen(false)}
            >
              <span className={styles.menuIcon} aria-hidden>
                {item.icon}
              </span>
              <span className={styles.menuLabel}>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 ? (
                <span className={styles.badge} aria-label={`${item.badge} notifications`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className={styles.themeBlock}>
        <div className={styles.themeTitle}>Colour Scheme</div>
        <div className={styles.themeRow} role="group" aria-label="Theme">
          <button
            type="button"
            className={`${styles.themePill} ${theme !== 'home' ? styles.themePillActive : ''}`}
            onClick={() => theme === 'home' && toggleTheme()}
          >
            Light
          </button>
          <button
            type="button"
            className={`${styles.themePill} ${theme === 'home' ? styles.themePillActive : ''}`}
            onClick={() => theme !== 'home' && toggleTheme()}
          >
            Dark
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <div className={styles.desktopWrap}>
        <nav className={styles.rail} aria-label="Primary">
          <div className={styles.railTop}>
            <div className={styles.railAvatar} aria-hidden>
              {profile.avatar}
            </div>
          </div>
          <div className={styles.railLinks}>
            {rail.map((r) => {
              const active = pathname === r.href || pathname.startsWith(r.href + '/')
              return (
                <Link key={r.href} href={r.href} className={`${styles.railLink} ${active ? styles.railLinkActive : ''}`} aria-label={r.label}>
                  {r.icon}
                </Link>
              )
            })}
          </div>
          <div className={styles.railBottom}>
            <button type="button" className={styles.railLink} aria-label="Toggle theme" onClick={toggleTheme}>
              <RailIcon>☀︎</RailIcon>
            </button>
          </div>
        </nav>

        {renderPanel('desktop')}
      </div>

      <button
        type="button"
        className={styles.mobileOpen}
        aria-label="Open menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <span aria-hidden>☰</span>
      </button>

      {mobileOpen && <div className={styles.backdrop} role="presentation" onClick={() => setMobileOpen(false)} />}
      <div className={`${styles.mobileDrawer} ${mobileOpen ? styles.mobileDrawerOpen : ''}`}>{renderPanel('mobile')}</div>
    </>
  )
}

