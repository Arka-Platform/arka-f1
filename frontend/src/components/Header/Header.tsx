import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../shared/Logo/Logo'
import UserMenu from '../shared/UserMenu/UserMenu'
import styles from './Header.module.css'

const Header: React.FC = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/pickup', label: 'Waste Paper Pickup' },
    { path: '/books', label: 'Books Marketplace' },
    { path: '/contact', label: 'Contact' },
  ]

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

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

  const isActiveLink = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <Logo size="medium" />
          
          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`${styles.navLink} ${isActiveLink(link.path) ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons / User Menu */}
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.button}>
                Log in
              </Link>
              <Link to="/register" className={styles.button}>
                Register
              </Link>
            </div>
          )}

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
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.mobileNavLink} ${isActiveLink(link.path) ? styles.mobileNavLinkActive : ''}`}
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}
          
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
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default Header

