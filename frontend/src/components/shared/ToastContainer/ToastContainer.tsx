'use client'

import React from 'react'
import Toast, { ToastProps } from '../Toast/Toast'
import styles from './ToastContainer.module.css'

type ToastMessage = Omit<ToastProps, 'onClose'>

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null

  return (
    <div className={styles.container} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}

export default ToastContainer


