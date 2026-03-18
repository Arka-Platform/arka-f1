import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, Session } from '../lib/supabaseClient'

interface User {
  id: string
  email: string | null
  firstName: string
  lastName: string
  phoneNumber?: string | null
  avatar?: string | null
  isAdmin?: boolean
  creditBalance?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithPhone: (phone: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user from Supabase
  const fetchUser = async () => {
    setIsLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session: Session | null = sessionData.session ?? null

      if (!session) {
        setUser(null)
        return
      }

      const supabaseUser = session.user

      // Map user_metadata safely
      const metadata = supabaseUser.user_metadata as Record<string, any> | undefined

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        firstName: metadata?.first_name ?? '',
        lastName: metadata?.last_name ?? '',
        phoneNumber: supabaseUser.phone ?? null,
        avatar: metadata?.avatar ?? null,
        isAdmin: metadata?.is_admin ?? false,
        creditBalance: metadata?.credit_balance ?? 0,
      })
    } catch (err) {
      console.error('Error fetching user:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Listen to auth state changes
    const listener = supabase.auth.onAuthStateChange((_event, _session) => {
      fetchUser()
    })

    // Cleanup on unmount
    return () => listener.subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await fetchUser()
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithPhone = async (phone: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async ({ firstName, lastName, email, password }: RegisterData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      })
      if (error) throw error
      await fetchUser()
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    setIsLoading(true)
    await fetchUser()
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithPhone,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
