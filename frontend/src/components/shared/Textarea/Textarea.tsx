'use client'

import React, { useId } from 'react'
import styles from './Textarea.module.css'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const reactId = useId()
  const textareaId = props.id ?? `textarea-${reactId}`
  const errorId = error ? `${textareaId}-error` : undefined
  const describedBy = [props['aria-describedby'], errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`${styles.textareaWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label className={styles.label} htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        className={`${styles.textarea} ${error ? styles.error : ''} ${className}`}
        {...props}
        id={textareaId}
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

export default Textarea


