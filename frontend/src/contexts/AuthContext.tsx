import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../utils/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: RegisterData) => Promise<void>
  isLoading: boolean
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('arka_user')
    const storedToken = localStorage.getItem('arka_token')
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('arka_user')
        localStorage.removeItem('arka_token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await api.post<{
        token: string
        userId: string
        email: string
        firstName: string
        lastName: string
      }>('/api/v1/users/login', { email, password })
      
      const userData: User = {
        id: response.userId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
      }
      
      setUser(userData)
      localStorage.setItem('arka_user', JSON.stringify(userData))
      localStorage.setItem('arka_token', response.token)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await api.post<{
        token: string
        userId: string
        email: string
        firstName: string
        lastName: string
      }>('/api/v1/users/register', userData)
      
      const newUser: User = {
        id: response.userId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
      }
      
      setUser(newUser)
      localStorage.setItem('arka_user', JSON.stringify(newUser))
      localStorage.setItem('arka_token', response.token)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('arka_user')
    localStorage.removeItem('arka_token')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


