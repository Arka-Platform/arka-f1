import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

interface User {
  id: string
  email: string | null
  firstName: string
  lastName: string
  phoneNumber?: string
  avatar?: string
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
    const session = await supabase.auth.getSession()
    if (!session.data.session) {
      setUser(null)
      setIsLoading(false)
      return
    }

    const supabaseUser = session.data.session.user

    const { data, error } = await supabase
      .from<User>('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } else {
      setUser(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchUser()

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Email/password login
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data: _data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await fetchUser()
    } finally {
      setIsLoading(false)
    }
  }

  // Phone login (OTP)
  const loginWithPhone = async (phone: string) => {
    setIsLoading(true)
    try {
      const { data: _data, error } = await supabase.auth.signInWithOtp({ phone })
      if (error) throw error
      // OTP will be sent to phone; user verifies externally
    } finally {
      setIsLoading(false)
    }
  }

  // Google login
  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
      // Redirect handled by Supabase
    } finally {
      setIsLoading(false)
    }
  }

  // Signup (email/password)
  const register = async ({ firstName, lastName, email, password }: RegisterData) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      })
      if (error) throw error

      // Insert user into 'users' table
      if (data.user) {
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            password_hash: password, // store hashed if using custom hashing
            email_verified: false,
            phone_verified: false,
            credit_balance: 0,
            is_admin: false,
          },
        ])
        if (insertError) throw insertError
      }

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