import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { supabase, } from '../lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { fetchSupabasePublicUserById, syncSupabasePublicUser } from '../utils/supabaseProfileSync'
import { getEnv } from '../lib/env'

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
  loginWithEmailOtp: (
    email: string,
    options?: {
      mode?: 'signin' | 'signup'
      firstName?: string
      lastName?: string
    }
  ) => Promise<void>
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>
  verifyEmailOtp: (email: string, token: string) => Promise<void>
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
  const profileSyncInFlightRef = useRef<Promise<void> | null>(null)
  const lastProfileSyncedUserIdRef = useRef<string | null>(null)
  const latestUserIdRef = useRef<string | null>(null)
  const googleOauthInFlightRef = useRef(false)

  const fetchUser = async (sessionOverride?: Session | null) => {
    setIsLoading(true)
    try {
      const session: Session | null =
        sessionOverride !== undefined
          ? sessionOverride
          : (await supabase.auth.getSession()).data.session ?? null

      if (!session) {
        if (typeof window !== 'undefined') localStorage.removeItem('arka_user')
        setUser(null)
        lastProfileSyncedUserIdRef.current = null
        profileSyncInFlightRef.current = null
        latestUserIdRef.current = null
        return
      }

      const supabaseUser = session.user
      const metadata = supabaseUser.user_metadata as Record<string, any> | undefined
      latestUserIdRef.current = supabaseUser.id

      const normalizedUser = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        firstName: metadata?.first_name ?? '',
        lastName: metadata?.last_name ?? '',
        phoneNumber: supabaseUser.phone ?? null,
        avatar: metadata?.avatar ?? null,
        isAdmin: metadata?.is_admin ?? false,
        creditBalance: metadata?.credit_balance ?? 0,
      }

      setUser(normalizedUser)
      if (typeof window !== 'undefined') localStorage.setItem('arka_user', JSON.stringify(normalizedUser))

      // Best-effort profile sync: never block auth UX.
      // Prevent redundant syncs for the same user within a session, and avoid races.
      const userId = supabaseUser.id
      if (
        userId &&
        lastProfileSyncedUserIdRef.current !== userId &&
        !profileSyncInFlightRef.current
      ) {
        // eslint-disable-next-line no-console
        console.info('[AuthContext] syncing Supabase public.user', { userId })
        profileSyncInFlightRef.current = (async () => {
          try {
            await syncSupabasePublicUser(supabaseUser)
            lastProfileSyncedUserIdRef.current = userId

            // Hydrate some fields if the public user table is readable.
            // This is best-effort: failures should not break auth UX.
            const publicUser = await fetchSupabasePublicUserById(userId)
            if (!publicUser) return

            if (latestUserIdRef.current !== userId) return

            setUser((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                firstName: (publicUser.first_name ?? prev.firstName ?? '').toString(),
                lastName: (publicUser.last_name ?? prev.lastName ?? '').toString(),
                email: publicUser.email ?? prev.email ?? null,
                phoneNumber: publicUser.phone ?? prev.phoneNumber ?? null,
                avatar: publicUser.avatar_url ?? prev.avatar ?? null,
                isAdmin: publicUser.is_admin ?? prev.isAdmin ?? false,
                creditBalance: (() => {
                  const raw = publicUser.credit_balance
                  if (raw === undefined || raw === null) return prev.creditBalance ?? 0
                  const n = Number(raw)
                  return Number.isFinite(n) ? n : prev.creditBalance ?? 0
                })(),
              }
            })
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[AuthContext] Supabase public.user sync/hydrate failed', { userId, err })
          } finally {
            profileSyncInFlightRef.current = null
          }
        })()
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUser(session ?? null)
    })

    return () => authListener.subscription.unsubscribe()
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

  const loginWithEmailOtp = async (
    email: string,
    options?: {
      mode?: 'signin' | 'signup'
      firstName?: string
      lastName?: string
    }
  ) => {
    const mode = options?.mode ?? 'signin'
    const firstName = options?.firstName
    const lastName = options?.lastName

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === 'signup',
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            ...(firstName ? { first_name: firstName } : {}),
            ...(lastName ? { last_name: lastName } : {}),
          },
        },
      })
      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPhoneOtp = async (phone: string, token: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      })
      if (error) throw error
      await fetchUser()
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmailOtp = async (email: string, token: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      if (error) throw error
      await fetchUser()
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    if (googleOauthInFlightRef.current) return
    setIsLoading(true)
    try {
      // Avoid starting OAuth again if we already have a valid Supabase session.
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user?.id) return

      const normalizeRedirectTo = (value: string) => {
        // Allow both absolute and pathname-only values.
        if (value.startsWith('http://') || value.startsWith('https://')) return value
        if (value.startsWith('/')) return `${window.location.origin}${value}`
        return value
      }

      // Use an absolute redirectTo so localhost vs production ports match Supabase config.
      const redirectToDefault = `${window.location.origin}/auth/callback`
      const redirectToOverride = getEnv('NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_TO') as string | undefined
      const redirectTo = redirectToOverride
        ? normalizeRedirectTo(redirectToOverride)
        : redirectToDefault

      googleOauthInFlightRef.current = true
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) throw error
    } finally {
      setIsLoading(false)
      googleOauthInFlightRef.current = false
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
      if (typeof window !== 'undefined') localStorage.removeItem('arka_user')
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
        loginWithEmailOtp,
        verifyPhoneOtp,
        verifyEmailOtp,
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
