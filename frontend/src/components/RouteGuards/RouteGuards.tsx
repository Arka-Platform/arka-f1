'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface GuardProps {
  children: React.ReactElement
}

export const ProtectedRoute: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) return
    const next = encodeURIComponent(pathname || '/home')
    router.replace(`/login?next=${next}`)
  }, [isAuthenticated, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
        <span>Loading...</span>
      </div>
    )
  }
  if (!isAuthenticated) {
    return null
  }
  return children
}

export const AdminRoute: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname || '/home')
      router.replace(`/admin/login?next=${next}`)
      return
    }
    if (!user?.isAdmin) {
      router.replace('/home')
    }
  }, [isAuthenticated, isLoading, pathname, router, user?.isAdmin])

  if (isLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
        <span>Loading...</span>
      </div>
    )
  }
  if (!isAuthenticated) {
    return null
  }
  if (!user?.isAdmin) {
    return null
  }
  return children
}
