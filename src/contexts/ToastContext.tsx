import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ToastProps } from '../components/shared/Toast/Toast'

interface ToastContextType {
  toasts: ToastProps[]
  showToast: (message: string, type: ToastProps['type'], duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = (message: string, type: ToastProps['type'] = 'info', duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      id,
      message,
      type,
      duration,
    }
    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message: string, duration?: number) => {
    showToast(message, 'success', duration)
  }

  const error = (message: string, duration?: number) => {
    showToast(message, 'error', duration)
  }

  const info = (message: string, duration?: number) => {
    showToast(message, 'info', duration)
  }

  const warning = (message: string, duration?: number) => {
    showToast(message, 'warning', duration)
  }

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        success,
        error,
        info,
        warning,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}


