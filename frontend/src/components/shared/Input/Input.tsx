'use client'

import React, { useId } from 'react'
import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const reactId = useId()
  const inputId = props.id ?? `input-${reactId}`
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [props['aria-describedby'], errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`${styles.inputWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        className={`${styles.input} ${error ? styles.error : ''} ${className}`}
        {...props}
        id={inputId}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={describedBy}
      />
      {error && (
        <span className={styles.errorText} id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default Input


