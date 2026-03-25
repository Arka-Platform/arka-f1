"use client"

import type { ReactNode } from 'react'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { CartProvider } from '../../contexts/CartContext'
import { ToastProvider } from '../../contexts/ToastContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

