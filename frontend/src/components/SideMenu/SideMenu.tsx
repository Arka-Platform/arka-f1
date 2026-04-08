'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDroppable } from '@dnd-kit/core'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { wishlistApi } from '../../utils/api'
import { useCirculationQuickActions } from '../Layout/CirculationDndContext'
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

const DROP_IDS: Record<string, 'circulation-drop-shelf' | 'circulation-drop-wishlist'> = {
  shelf: 'circulation-drop-shelf',
  wishlist: 'circulation-drop-wishlist',
}

function DroppableBottomSlot({
  dropId,
  disabled,
  children,
  className,
}: {
  dropId: string
  disabled: boolean
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${!disabled && isOver ? styles.dropOver : ''}`.trim()}
      data-drop-target={disabled ? undefined : dropId}
    >
      {children}
    </div>
  )
}

export default function SideMenu() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { getItemCount } = useCart()
  const { triggerDrop, getActivePayload } = useCirculationQuickActions()
  const [expanded, setExpanded] = useState(true)
  const [wishlistCount, setWishlistCount] = useState(0)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isCirculationRoute = pathname.startsWith('/circulation')
  const dropEnabled = isCirculationRoute && isMobile && !!user
  const addBookHref = '/inventory?focus=add'

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

  const profileAvatar = useMemo(() => initials(user?.firstName, user?.lastName, user?.email ?? null), [user])

  const items: MenuItem[] = useMemo(() => {
    const base: MenuItem[] = [
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
        id: 'circulation',
        label: 'Circulation',
        href: '/circulation',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v6" />
            <path d="M9 6l3-3 3 3" />
            <path d="M12 21v-6" />
            <path d="M9 18l3 3 3-3" />
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
    ]

    return base
  }, [])

  const bottomItems: MenuItem[] = useMemo(() => {
    if (isCirculationRoute && isMobile) {
      return [
        {
          id: 'shelf',
          label: 'MyShelf',
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
          id: 'clubProfile',
          label: 'Profile',
          href: '/account',
          icon: <span className={styles.profileCircle}>{profileAvatar}</span>,
        },
      ]
    }

    return [
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
        icon: <span className={styles.profileCircle}>{profileAvatar}</span>,
      },
    ]
  }, [cartCount, profileAvatar, wishlistCount, isCirculationRoute, isMobile])

  const renderTopLink = (item: MenuItem, variant: 'desktop' | 'mobile') => {
    const hrefPath = item.href.split('?')[0]
    const active = pathname === hrefPath || pathname.startsWith(hrefPath + '/')
    const linkClass =
      variant === 'mobile'
        ? `${styles.mobileNavItem} ${active ? styles.mobileNavItemActive : ''}`
        : `${styles.menuItem} ${active ? styles.menuItemActive : ''}`
    return (
      <Link href={item.href} className={linkClass}>
        <span className={styles.menuIcon} aria-hidden>
          {item.icon}
          {typeof item.badge === 'number' && item.badge > 0 ? (
            <span
              className={`${styles.badgeInIcon} ${item.id === 'wishlist' ? styles.badgeDanger : styles.badgeSuccess}`}
              aria-label={`${item.badge} notifications`}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          ) : null}
        </span>
        <span className={styles.menuLabel}>{item.label}</span>
      </Link>
    )
  }

  const renderBottomLink = (item: MenuItem, variant: 'desktop' | 'mobile') => {
    const hrefPath = item.href.split('?')[0]
    const active = pathname === hrefPath || pathname.startsWith(hrefPath + '/')
    const dropId = DROP_IDS[item.id] ?? undefined
    const linkClass =
      variant === 'mobile'
        ? `${styles.mobileNavItem} ${active ? styles.mobileNavItemActive : ''}`
        : `${styles.menuItem} ${active ? styles.menuItemActive : ''}`

    const content = (
      <>
        <span className={styles.menuIcon} aria-hidden>
          {item.icon}
          {typeof item.badge === 'number' && item.badge > 0 ? (
            <span
              className={`${styles.badgeInIcon} ${item.id === 'wishlist' ? styles.badgeDanger : styles.badgeSuccess}`}
              aria-label={`${item.badge} notifications`}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          ) : null}
        </span>
        <span className={styles.menuLabel}>{item.label}</span>
      </>
    )

    const isCirculationMobileActions = variant === 'mobile' && isCirculationRoute && isMobile && !!user

    const maybeActionButton =
      isCirculationMobileActions && (item.id === 'shelf' || item.id === 'wishlist')
        ? (
            <button
              type="button"
              className={linkClass}
              onClick={(e) => {
                e.preventDefault()
                const payload = getActivePayload()
                if (!payload?.bookId) return
                if (item.id === 'shelf') triggerDrop('shelf')
                else if (item.id === 'wishlist') triggerDrop('wishlist')
              }}
              aria-label={item.label}
            >
              {content}
            </button>
          )
        : null

    const link = maybeActionButton ?? (
      <Link href={item.href} className={linkClass}>
        {content}
      </Link>
    )

    if (variant === 'desktop') {
      return link
    }

    if (dropId) {
      return (
        <DroppableBottomSlot dropId={dropId} disabled={!dropEnabled} className={styles.mobileDropSlot}>
          {link}
        </DroppableBottomSlot>
      )
    }

    return <span className={styles.mobileBottomItemPlain}>{link}</span>
  }

  return (
    <>
      <div className={styles.mobileNavHost}>
        <div className={styles.mobileTopBar}>
          <nav className={styles.mobileTopScroll} aria-label="App menu">
            {items.map((item) => (
              <Fragment key={item.id}>{renderTopLink(item, 'mobile')}</Fragment>
            ))}
          </nav>
        </div>

        <div className={styles.mobileBottomBar}>
          <nav className={styles.mobileBottomScroll} aria-label="Account shortcuts">
            {bottomItems.map((item) => (
              <Fragment key={item.id}>{renderBottomLink(item, 'mobile')}</Fragment>
            ))}
          </nav>
        </div>

        {user ? (
          <Link href={addBookHref} className={styles.addBookFab} aria-label="Add a book" title="Add a book">
            <span aria-hidden className={styles.addBookFabPlus}>
              +
            </span>
          </Link>
        ) : null}
      </div>

      <aside
        className={`${styles.sidebar} ${expanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}
        aria-label="Menu"
      >
        <div className={styles.sidebarTop}>
          <button
            type="button"
            className={styles.expandToggle}
            aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <span aria-hidden className={styles.expandToggleIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {expanded ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
              </svg>
            </span>
          </button>
        </div>

        <nav className={styles.menuList} aria-label="App menu">
          {items.map((item) => (
            <Fragment key={item.id}>{renderTopLink(item, 'desktop')}</Fragment>
          ))}
        </nav>

        <div className={styles.bottomStack}>
          <nav className={styles.menuList} aria-label="Account shortcuts">
            {bottomItems.map((item) => (
              <Fragment key={item.id}>{renderBottomLink(item, 'desktop')}</Fragment>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
