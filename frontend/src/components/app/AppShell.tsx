"use client"

import type { ReactNode } from 'react'
import React, { Suspense } from 'react'
import Layout from '../Layout/Layout'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import ToastContainer from '../shared/ToastContainer/ToastContainer'
import { useToast } from '../../contexts/ToastContext'

export default function AppShell({ children }: { children: ReactNode }) {
  const { toasts, removeToast } = useToast()

  return (
    <div className="app">
      <ErrorBoundary>
        <Layout>
          <Suspense fallback={<div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>Loading...</div>}>
            {children}
          </Suspense>
        </Layout>
      </ErrorBoundary>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}

