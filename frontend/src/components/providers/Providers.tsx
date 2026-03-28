"use client"

import type { ReactNode } from 'react'
import ContributionGateHost from '../contribution/ContributionGateHost'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { ContributionProvider } from '../../contexts/ContributionContext'
import { CartProvider } from '../../contexts/CartContext'
import { ToastProvider } from '../../contexts/ToastContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ContributionProvider>
          <CartProvider>
            <ToastProvider>
              <ContributionGateHost />
              {children}
            </ToastProvider>
          </CartProvider>
        </ContributionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

