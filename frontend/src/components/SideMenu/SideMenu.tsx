'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useTheme } from '../../contexts/ThemeContext'
import { wishlistApi } from '../../utils/api'
import styles from './SideMenu.module.css'

type MenuItem = {
  id: string
  label: string
  href: string
  badge?: number
  icon: React.ReactNode
}

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
  const { getItemCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [expanded, setExpanded] = useState(true)
  const [wishlistCount, setWishlistCount] = useState(0)

  const profile = useMemo(() => {
    const name =
      isAuthenticated && user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || (user.email ?? 'Account')
        : 'Guest'
    const email = isAuthenticated && user ? user.email ?? '' : 'Sign in to sync'
    const avatar = initials(user?.firstName, user?.lastName, user?.email ?? null)
    return { name, email, avatar }
  }, [isAuthenticated, user])

  useEffect(() => {
    const loadWishlistCount = async () => {
      if (!user?.id) {
        setWishlistCount(0)
        return
      }
      try {
        const response = await wishlistApi.getWishlistCount(user.id)
        setWishlistCount(response.count)
      } catch {
        setWishlistCount(0)
      }
    }

    void loadWishlistCount()
    const handleWishlistUpdate = () => void loadWishlistCount()
    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
  }, [user?.id])

  const cartCount = getItemCount()

  const items: MenuItem[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        href: '/home',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10.5l9-7 9 7" />
            <path d="M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10" />
            <path d="M10 22V14h4v8" />
          </svg>
        ),
      },
      {
        id: 'browse',
        label: 'Browse',
        href: '/books',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        id: 'pass',
        label: 'Pass',
        href: '/inventory?focus=add',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        ),
      },
      {
        id: 'pick',
        label: 'Pick',
        href: '/cart',
        badge: cartCount > 0 ? cartCount : undefined,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 2L7 6m6-4l2 4M3 6h18l-2 13H5L3 6z" />
          </svg>
        ),
      },
      {
        id: 'shelf',
        label: 'My Shelf',
        href: '/bookshelf',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        id: 'wishlist',
        label: 'Wishlist',
        href: '/wishlist',
        badge: wishlistCount > 0 ? wishlistCount : undefined,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
          </svg>
        ),
      },
      {
        id: 'requests',
        label: 'Requests',
        href: '/requests',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        ),
      },
      {
        id: 'community',
        label: 'Community',
        href: '/community',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z" />
            <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3z" />
            <path d="M8 13c-2.67 0-8 1.34-8 4v2h10" />
            <path d="M16 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" opacity="0.35" />
          </svg>
        ),
      },
      {
        id: 'recycle',
        label: 'Recycle',
        href: '/recycling',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 19l-2-2 2-2" />
            <path d="M5 17h7a4 4 0 0 0 0-8H9" />
            <path d="M17 5l2 2-2 2" />
            <path d="M19 7h-7a4 4 0 0 0 0 8h3" />
          </svg>
        ),
      },
      {
        id: 'account',
        label: 'Account',
        href: '/account',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21a8 8 0 1 0-16 0" />
            <circle cx="12" cy="8" r="4" />
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
    [cartCount, wishlistCount]
  )

  return (
    <aside className={`${styles.sidebar} ${expanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`} aria-label="Menu">
      <div className={styles.sidebarTop}>
        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden>
            {profile.avatar}
          </div>
          <div className={styles.profileText}>
            <div className={styles.profileName}>{profile.name}</div>
            <div className={styles.profileEmail}>{profile.email}</div>
          </div>
        </div>

        <button
          type="button"
          className={styles.expandToggle}
          aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '«' : '»'}
        </button>
      </div>

      <nav className={styles.menuList} aria-label="App menu">
        {items.map((item) => {
          const hrefPath = item.href.split('?')[0]
          const active = pathname === hrefPath || pathname.startsWith(hrefPath + '/')
          return (
            <Link key={item.id} href={item.href} className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}>
              <span className={styles.menuIcon} aria-hidden>
                {item.icon}
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <span
                    className={`${styles.badgeInIcon} ${
                      item.id === 'wishlist' ? styles.badgeDanger : styles.badgeSuccess
                    }`}
                    aria-label={`${item.badge} notifications`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </span>
              <span className={styles.menuLabel}>{item.label}</span>
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
            <span className={styles.themeIcon} aria-hidden>
              ☀︎
            </span>
            <span className={styles.themeLabel}>Light</span>
          </button>
          <button
            type="button"
            className={`${styles.themePill} ${theme === 'home' ? styles.themePillActive : ''}`}
            onClick={() => theme !== 'home' && toggleTheme()}
          >
            <span className={styles.themeIcon} aria-hidden>
              ☾
            </span>
            <span className={styles.themeLabel}>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

