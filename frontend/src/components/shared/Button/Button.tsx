import React from 'react'
import styles from './Button.module.css'

export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  fullWidth?: boolean
  size?: 'small' | 'medium'
  /** Backwards-compatible alias for size="small" */
  small?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  size = 'medium',
  small = false,
  disabled = false,
  loading = false,
  className = '',
}) => {
  const resolvedSize: 'small' | 'medium' = small ? 'small' : size
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${styles.button} ${styles[variant]} ${styles[resolvedSize]} ${fullWidth ? styles.fullWidth : ''} ${loading ? styles.loading : ''} ${className}`}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </span>
      )}
      <span className={loading ? styles.hidden : ''}>{children}</span>
    </button>
  )
}

export default Button

