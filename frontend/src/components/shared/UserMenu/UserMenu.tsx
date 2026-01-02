import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import styles from './UserMenu.module.css'

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    navigate('/')
  }

  const getInitials = () => {
    if (!user) return 'U'
    const first = user.firstName.charAt(0).toUpperCase()
    const last = user.lastName.charAt(0).toUpperCase()
    return `${first}${last}`
  }

  const getUserName = () => {
    if (!user) return 'User'
    return `${user.firstName} ${user.lastName}`
  }

  if (!user) return null

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        className={styles.userButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={styles.avatar}>
          {user.avatar ? (
            <img src={user.avatar} alt={getUserName()} />
          ) : (
            <span>{getInitials()}</span>
          )}
        </div>
        <span className={styles.userName}>{getUserName()}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <div className={styles.dropdownAvatar}>
              {user.avatar ? (
                <img src={user.avatar} alt={getUserName()} />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            <div className={styles.dropdownUserInfo}>
              <div className={styles.dropdownUserName}>{getUserName()}</div>
              <div className={styles.dropdownUserEmail}>{user.email}</div>
            </div>
          </div>
          <div className={styles.dropdownDivider} />
          <Link
            to="/account"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Account Settings
          </Link>
          <Link
            to="/analytics"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Analytics
          </Link>
          <Link
            to="/bookshelf"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            My Bookshelf
          </Link>
          <Link
            to="/subscriptions"
            className={`${styles.dropdownItem} ${styles.subscriptionItem}`}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <div className={styles.subscriptionItemContent}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Subscriptions</span>
            </div>
            <span className={styles.subscriptionBadge}>Save</span>
          </Link>
          <Link
            to="/orders"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Orders
          </Link>
          <div className={styles.dropdownDivider} />
          <button
            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            onClick={handleLogout}
            role="menuitem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu

