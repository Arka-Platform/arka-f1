import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import Input from '../../../components/shared/Input/Input'
import Button from '../../../components/shared/Button/Button'
import { adminApi } from '../../../utils/api'
import styles from './AdminLogin.module.css'

const AdminLogin: React.FC = () => {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const { success, error: showError } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      showError('Please enter both email and password')
      return
    }

    try {
      setLoading(true)
      await adminApi.login(email, password)
      await refreshUser()
      
      success('Admin login successful')
      router.push('/admin/ngos')
    } catch (err: any) {
      showError(err.message || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.adminLogin}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <h1 className={styles.title}>Arka Admin Portal</h1>
          <p className={styles.subtitle}>NGO Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <Input
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <div className={styles.warning}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>This portal is restricted to Arka team members only.</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin


