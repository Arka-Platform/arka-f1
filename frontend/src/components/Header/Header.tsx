import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import Logo from '../shared/Logo/Logo'
import UserMenu from '../shared/UserMenu/UserMenu'
import styles from './Header.module.css'

interface DropdownItem {
  label: string
  path: string
  icon?: React.ReactNode
  badge?: string
}

interface DropdownMenu {
  label: string
  defaultPath?: string
  items: DropdownItem[]
}

const Header: React.FC = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { getItemCount } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const cartItemCount = getItemCount()
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Define dropdown menus with default paths
  const booksMenu: DropdownMenu = {
    label: 'Books',
    defaultPath: '/books',
    items: [
      {
        label: 'Marketplace',
        path: '/books',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        label: 'Recommendations',
        path: '/home',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        ),
      },
      {
        label: 'My Inventory',
        path: '/inventory',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6v6H9z" />
          </svg>
        ),
      },
    ],
  }

  const communityMenu: DropdownMenu = {
    label: 'Community',
    defaultPath: '/home',
    items: [
      {
        label: 'Circles',
        path: '/home',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        ),
      },
      {
        label: 'Chain Stories',
        path: '/home',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
    ],
  }

  const servicesMenu: DropdownMenu = {
    label: 'Services',
    defaultPath: '/lending',
    items: [
      {
        label: 'Book Lending',
        path: '/lending',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        ),
      },
      {
        label: 'Subscriptions',
        path: '/subscriptions',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        ),
      },
      {
        label: 'Recycling & Pickup',
        path: '/recycling',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        ),
      },
    ],
  }

  const dropdownMenus = [booksMenu, communityMenu, servicesMenu]

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setActiveDropdown(null)
  }, [location.pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && !ref.contains(target)) {
          // Don't close if clicking on a Link
          const clickedElement = target as Element
          if (!clickedElement.closest('a')) {
            setActiveDropdown(null)
          }
        }
      })
    }

    if (activeDropdown) {
      // Use a slight delay to allow Link navigation to register first
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 50)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [activeDropdown])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleDropdown = (menuLabel: string) => {
    setActiveDropdown(activeDropdown === menuLabel ? null : menuLabel)
  }

  const isActiveLink = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const isActiveMenu = (menu: DropdownMenu) => {
    return menu.items.some((item) => isActiveLink(item.path))
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link to="/home" className={styles.logoLink}>
            <Logo size="medium" />
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Main navigation">
            {dropdownMenus.map((menu) => (
              <div
                key={menu.label}
                className={styles.dropdownWrapper}
                ref={(el) => {
                  dropdownRefs.current[menu.label] = el
                }}
              >
                <div className={styles.navButtonWrapper}>
                  {menu.defaultPath ? (
                    <Link
                      to={menu.defaultPath}
                      className={`${styles.navButtonLink} ${isActiveMenu(menu) ? styles.active : ''}`}
                    >
                      {menu.label}
                    </Link>
                  ) : (
                    <span className={`${styles.navButton} ${isActiveMenu(menu) ? styles.active : ''}`}>
                      {menu.label}
                    </span>
                  )}
                  <button
                    className={`${styles.dropdownToggle} ${activeDropdown === menu.label ? styles.open : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      toggleDropdown(menu.label)
                    }}
                    aria-expanded={activeDropdown === menu.label}
                    aria-haspopup="true"
                    aria-label={`${menu.label} menu`}
                  >
                    <svg
                      className={`${styles.chevron} ${activeDropdown === menu.label ? styles.chevronOpen : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
                {activeDropdown === menu.label && (
                  <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                    {menu.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`${styles.dropdownItem} ${isActiveLink(item.path) ? styles.dropdownItemActive : ''}`}
                        onClick={(e) => {
                          // Stop propagation to prevent dropdown wrapper from interfering
                          e.stopPropagation()
                          // Close dropdown immediately - navigation will happen via React Router
                          setActiveDropdown(null)
                        }}
                      >
                        <span className={styles.dropdownIcon}>{item.icon}</span>
                        <span className={styles.dropdownLabel}>{item.label}</span>
                        {item.badge && <span className={styles.badge}>{item.badge}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link
              to="/contact"
              className={`${styles.navLink} ${isActiveLink('/contact') ? styles.active : ''}`}
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Right Section */}
          <div className={styles.rightSection}>
            {isAuthenticated && (
              <Link to="/analytics" className={styles.iconButton} aria-label="Analytics">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </Link>
            )}
            <Link to="/cart" className={styles.cartLink} aria-label="Shopping cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 2L7 6m6-4l2 4M3 6h18l-2 13H5L3 6z" />
                <path d="M9 10v6m6-6v6" />
              </svg>
              {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
            </Link>
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login" className={styles.buttonSecondary}>
                  Log in
                </Link>
                <Link to="/register" className={styles.buttonPrimary}>
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className={styles.mobileMenuOverlay}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <nav
        id="mobile-menu"
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
        aria-label="Mobile navigation"
      >
        <div className={styles.mobileMenuContent}>
          {dropdownMenus.map((menu) => (
            <div key={menu.label} className={styles.mobileMenuSection}>
              <div className={styles.mobileMenuSectionTitle}>{menu.label}</div>
              {menu.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles.mobileNavLink} ${isActiveLink(item.path) ? styles.mobileNavLinkActive : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.mobileNavIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <Link
            to="/contact"
            className={`${styles.mobileNavLink} ${isActiveLink('/contact') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
          >
            Contact
          </Link>

          {isAuthenticated && (
            <Link
              to="/analytics"
              className={`${styles.mobileNavLink} ${isActiveLink('/analytics') ? styles.mobileNavLinkActive : ''}`}
              onClick={closeMobileMenu}
            >
              <span className={styles.mobileNavIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              Analytics
            </Link>
          )}

          <Link
            to="/cart"
            className={`${styles.mobileNavLink} ${isActiveLink('/cart') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
          >
            <span className={styles.mobileNavIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 2L7 6m6-4l2 4M3 6h18l-2 13H5L3 6z" />
              </svg>
            </span>
            Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </Link>

          {isAuthenticated ? (
            <div className={styles.mobileUserSection}>
              <UserMenu />
            </div>
          ) : (
            <div className={styles.mobileAuthButtons}>
              <Link
                to="/login"
                className={styles.mobileButton}
                onClick={closeMobileMenu}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={`${styles.mobileButton} ${styles.mobileButtonPrimary}`}
                onClick={closeMobileMenu}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default Header
