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

export default function SideMenu() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { getItemCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [expanded, setExpanded] = useState(true)
  const [wishlistCount, setWishlistCount] = useState(0)

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
        label: 'Books',
        href: '/books',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
    ],
    []
  )

  const bottomItems: MenuItem[] = useMemo(
    () => [
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
        id: 'pick',
        label: 'Cart',
        href: '/cart',
        badge: cartCount > 0 ? cartCount : undefined,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 2L7 6m6-4l2 4M3 6h18l-2 13H5L3 6z" />
          </svg>
        ),
      },
      {
        id: 'clubProfile',
        label: 'Profile',
        href: '/account',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M13 9h5" />
            <path d="M13 13h5" />
            <path d="M7 16h5" />
          </svg>
        ),
      },
    ],
    [cartCount, wishlistCount]
  )

  return (
    <aside className={`${styles.sidebar} ${expanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`} aria-label="Menu">
      <div className={styles.sidebarTop}>
        <button
          type="button"
          className={styles.expandToggle}
          aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span aria-hidden className={styles.expandToggleIcon}>
            {expanded ? '«' : '»'}
          </span>
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

      <div className={styles.bottomStack}>
        <div className={styles.themeBlock}>
          <button
            type="button"
            className={styles.themeIconToggle}
            aria-label={theme === 'home' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          >
            <span className={styles.themeIcon} aria-hidden>
              {theme === 'home' ? '☀︎' : '☾'}
            </span>
          </button>
        </div>

        <nav className={styles.menuList} aria-label="Account shortcuts">
          {bottomItems.map((item) => {
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
      </div>
    </aside>
  )
}

