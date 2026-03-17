import React from 'react'
import styles from './Select.module.css'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  fullWidth?: boolean
  options?: { value: string; label: string }[]
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  fullWidth = false,
  options,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`${styles.selectWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectContainer}>
        <select
          className={`${styles.select} ${error ? styles.error : ''} ${className}`}
          {...props}
        >
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        <svg
          className={styles.chevron}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}

export default Select


