'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useTheme } from '../../contexts/ThemeContext'
import { booksApi, wishlistApi } from '../../utils/api'
import Logo from '../shared/Logo/Logo'
import UserMenu from '../shared/UserMenu/UserMenu'
import InstallAppButton from '../shared/InstallAppButton/InstallAppButton'
import styles from './Header.module.css'

const Header: React.FC = () => {
  const genresMenuId = 'genres-menu'
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { getItemCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeGenreDropdown, setActiveGenreDropdown] = useState(false)
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null)
  const [genresWithSubcategories, setGenresWithSubcategories] = useState<Array<{ genre: string; subcategories: string[] }>>([])
  const [loadingGenres, setLoadingGenres] = useState(true)
  const [wishlistCount, setWishlistCount] = useState(0)
  const cartItemCount = getItemCount()
  const genreDropdownRef = useRef<HTMLDivElement | null>(null)

  // Fetch genres with subcategories from API
  useEffect(() => {
    const loadGenres = async () => {
      try {
        setLoadingGenres(true)
        const data = await booksApi.getGenresWithSubcategories()
        setGenresWithSubcategories(data)
      } catch (error) {
        console.error('Error loading genres:', error)
        setGenresWithSubcategories([]) // Set empty array on error
      } finally {
        setLoadingGenres(false)
      }
    }
    loadGenres()
  }, [])

  // Load wishlist count
  useEffect(() => {
    const loadWishlistCount = async () => {
      if (user?.id) {
        try {
          const response = await wishlistApi.getWishlistCount(user.id)
          setWishlistCount(response.count)
        } catch (error) {
          console.error('Error loading wishlist count:', error)
        }
      } else {
        setWishlistCount(0)
      }
    }
    
    loadWishlistCount()
    
    // Listen for wishlist updates from BookCard
    const handleWishlistUpdate = () => {
      loadWishlistCount()
    }
    
    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
    }
  }, [user?.id])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setActiveGenreDropdown(false)
  }, [pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(target)) {
        setActiveGenreDropdown(false)
      }
    }

    if (activeGenreDropdown) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 50)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [activeGenreDropdown])

  // Close dropdowns with Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveGenreDropdown(false)
      }
    }

    if (activeGenreDropdown) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeGenreDropdown])

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

  // Close mobile menu with Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleGenreDropdown = () => {
    setActiveGenreDropdown(!activeGenreDropdown)
  }

  const handleGenreClick = (genre: string) => {
    router.push(`/books?genre=${encodeURIComponent(genre)}`)
    setActiveGenreDropdown(false)
    setHoveredGenre(null)
    closeMobileMenu()
  }

  const handleSubcategoryClick = (genre: string, subcategory: string) => {
    router.push(`/books?genre=${encodeURIComponent(genre)}&subcategory=${encodeURIComponent(subcategory)}`)
    setActiveGenreDropdown(false)
    setHoveredGenre(null)
    closeMobileMenu()
  }

  const isActiveLink = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <Logo size="medium" />

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Main navigation">
            {/* Home (icon) */}
            <Link
              href="/home"
              className={`${styles.navIconLink} ${isActiveLink('/home') ? styles.active : ''}`}
              aria-label="Home"
              title="Home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>

            {/* Browse with Genres Dropdown */}
            <div
              className={styles.dropdownWrapper}
              ref={genreDropdownRef}
            >
              <div className={styles.navButtonWrapper}>
                <Link
                  href="/books"
                  className={`${styles.navButtonLink} ${isActiveLink('/books') ? styles.active : ''}`}
                >
                  Browse
                </Link>
                <button
                  className={`${styles.dropdownToggle} ${activeGenreDropdown ? styles.open : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    toggleGenreDropdown()
                  }}
                  aria-expanded={activeGenreDropdown}
                  aria-haspopup="true"
                  aria-controls={genresMenuId}
                  aria-label="Genres menu"
                >
                  <svg
                    className={`${styles.chevron} ${activeGenreDropdown ? styles.chevronOpen : ''}`}
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
              {activeGenreDropdown && (
                <div
                  id={genresMenuId}
                  className={`${styles.dropdown} ${styles.genreDropdown}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {loadingGenres ? (
                    <div className={styles.loadingGenres}>Loading genres...</div>
                  ) : genresWithSubcategories.length === 0 ? (
                    <div className={styles.noGenres}>No genres available</div>
                  ) : (
                    <div className={styles.genreSubcategoryContainer}>
                      <div className={styles.genreList}>
                        {genresWithSubcategories.map((item) => (
                          <button
                            key={item.genre}
                            type="button"
                            className={`${styles.genreItem} ${hoveredGenre === item.genre ? styles.genreItemActive : ''}`}
                            onMouseEnter={() => setHoveredGenre(item.genre)}
                            onFocus={() => setHoveredGenre(item.genre)}
                            onClick={() => handleGenreClick(item.genre)}
                          >
                            {item.genre}
                            {item.subcategories.length > 0 && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      {hoveredGenre && (
                        <div className={styles.subcategoryList}>
                          {genresWithSubcategories
                            .find(item => item.genre === hoveredGenre)
                            ?.subcategories.map((subcategory) => (
                              <button
                                key={subcategory}
                                type="button"
                                className={styles.subcategoryItem}
                                onClick={() => handleSubcategoryClick(hoveredGenre, subcategory)}
                              >
                                {subcategory}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sell */}
            <Link
              href="/inventory"
              className={`${styles.navLink} ${isActiveLink('/inventory') ? styles.active : ''}`}
            >
              Sell
            </Link>

            {/* Recycle */}
            <Link
              href="/recycling"
              className={`${styles.navLink} ${isActiveLink('/recycling') ? styles.active : ''}`}
            >
              Recycle
            </Link>

            {/* Looking for */}
            <Link
              href="/requests"
              className={`${styles.navLink} ${isActiveLink('/requests') ? styles.active : ''}`}
            >
              Looking for
            </Link>

            {/* Community */}
            <Link
              href="/community"
              className={`${styles.navLink} ${isActiveLink('/community') || isActiveLink('/circles') || isActiveLink('/start-chain') ? styles.active : ''}`}
            >
              Community
            </Link>

          </nav>

          {/* Desktop Right Section */}
          <div className={styles.rightSection}>
            <InstallAppButton />
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={theme === 'home' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'home' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'home' ? (
                // Sun icon (light theme)
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M12 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 20v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4.93 4.93l1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17.66 17.66l1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M2 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4.93 19.07l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                // Moon icon (dark theme)
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 12.8A8.5 8.5 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            {/* Bookshelf, Wishlist, Offer — icon row */}
            {isAuthenticated && (
              <>
                <Link
                  href="/bookshelf"
                  className={`${styles.headerIconLink} ${isActiveLink('/bookshelf') ? styles.headerIconActive : ''}`}
                  aria-label="My Bookshelf"
                  title="My Bookshelf"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </Link>
                <Link href="/wishlist" className={styles.wishlistLink} aria-label="Wishlist" title="Wishlist">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
                  </svg>
                  {wishlistCount > 0 && <span className={styles.wishlistBadge}>{wishlistCount}</span>}
                </Link>
                <Link
                  href="/inventory?focus=add"
                  className={`${styles.headerIconLink} ${isActiveLink('/inventory') ? styles.headerIconActive : ''}`}
                  aria-label="Offer a book"
                  title="Offer a book"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                  </svg>
                </Link>
              </>
            )}
            <Link href="/cart" className={styles.cartLink} aria-label="Shopping cart">
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
                <Link href="/login" className={styles.buttonSecondary}>
                  Log in
                </Link>
                <Link href="/register" className={styles.buttonPrimary}>
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
          <Link
            href="/home"
            className={`${styles.mobileNavLink} ${styles.mobileNavLinkIcon} ${isActiveLink('/home') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
            aria-label="Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className={styles.mobileNavIconLabel}>Home</span>
          </Link>

          <Link
            href="/books"
            className={`${styles.mobileNavLink} ${isActiveLink('/books') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
          >
            Browse
          </Link>

          {/* Mobile Genre Section */}
          <div className={styles.mobileMenuSection}>
            <div className={styles.mobileMenuSectionTitle}>Genres & Subgenres</div>
            {loadingGenres ? (
              <div className={styles.loadingGenres}>Loading genres...</div>
            ) : genresWithSubcategories.length === 0 ? (
              <div className={styles.noGenres}>No genres available</div>
            ) : (
              genresWithSubcategories.map((item) => (
                <div key={item.genre} className={styles.mobileGenreCategory}>
                  <button
                    className={styles.mobileGenreItem}
                    onClick={() => {
                      handleGenreClick(item.genre)
                      closeMobileMenu()
                    }}
                  >
                    {item.genre}
                  </button>
                  {item.subcategories.length > 0 && (
                    <div className={styles.mobileSubcategoryList}>
                      {item.subcategories.map((subcategory) => (
                        <button
                          key={subcategory}
                          className={styles.mobileSubcategoryItem}
                          onClick={() => {
                            handleSubcategoryClick(item.genre, subcategory)
                            closeMobileMenu()
                          }}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <Link
            href="/inventory"
            className={`${styles.mobileNavLink} ${isActiveLink('/inventory') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
          >
            Sell
          </Link>

          <Link
            href="/recycling"
            className={`${styles.mobileNavLink} ${isActiveLink('/recycling') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
          >
            Recycle
          </Link>

          <Link
            href="/requests"
            className={`${styles.mobileNavLink} ${isActiveLink('/requests') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
          >
            Looking for
          </Link>

          <Link
            href="/community"
            className={`${styles.mobileNavLink} ${isActiveLink('/community') || isActiveLink('/circles') || isActiveLink('/start-chain') ? styles.mobileNavLinkActive : ''}`}
            onClick={closeMobileMenu}
          >
            Community
          </Link>

          <button
            type="button"
            className={styles.mobileThemeToggle}
            onClick={() => {
              toggleTheme()
              closeMobileMenu()
            }}
          >
            Switch to {theme === 'home' ? 'Default Theme' : 'Home Theme'}
          </button>

          <InstallAppButton
            variant="mobile"
            onInstalled={() => {
              closeMobileMenu()
            }}
          />

          {isAuthenticated && (
            <>
              <Link
                href="/bookshelf"
                className={`${styles.mobileNavLink} ${isActiveLink('/bookshelf') ? styles.mobileNavLinkActive : ''}`}
                onClick={closeMobileMenu}
              >
                <span className={styles.mobileNavIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </span>
                My Bookshelf
              </Link>
              <Link
                href="/wishlist"
                className={`${styles.mobileNavLink} ${isActiveLink('/wishlist') ? styles.mobileNavLinkActive : ''}`}
                onClick={closeMobileMenu}
              >
                <span className={styles.mobileNavIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
                  </svg>
                </span>
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
              <Link
                href="/inventory?focus=add"
                className={`${styles.mobileNavLink} ${isActiveLink('/inventory') ? styles.mobileNavLinkActive : ''}`}
                onClick={closeMobileMenu}
              >
                <span className={styles.mobileNavIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                  </svg>
                </span>
                Offer
              </Link>
            </>
          )}
          <Link
            href="/cart"
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
                href="/login"
                className={styles.mobileButton}
                onClick={closeMobileMenu}
              >
                Log in
              </Link>
              <Link
                href="/register"
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
