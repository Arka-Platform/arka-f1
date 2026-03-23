import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Login.module.css'

const Login: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, loginWithPhone, loginWithGoogle, isAuthenticated, isLoading } = useAuth()
  const { success, error: showError } = useToast()

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  })

  const [errors, setErrors] = useState<{ emailOrPhone?: string; password?: string }>({})

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/home')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const prefill = (location.state as { prefillEmailOrPhone?: string } | null)?.prefillEmailOrPhone
    if (!prefill) return
    setFormData((prev) => ({ ...prev, emailOrPhone: prefill }))
  }, [location.state])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: { emailOrPhone?: string; password?: string } = {}

    if (!formData.emailOrPhone) newErrors.emailOrPhone = 'Email or phone is required'
    else if (
      !/\S+@\S+\.\S+/.test(formData.emailOrPhone) &&
      !/^\+\d{10,15}$/.test(formData.emailOrPhone)
    ) {
      newErrors.emailOrPhone = 'Enter a valid email or phone (+countrycode)'
    }

    if (!/^\+\d{10,15}$/.test(formData.emailOrPhone) && !formData.password) {
      newErrors.password = 'Password is required for email login'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (/^\+\d{10,15}$/.test(formData.emailOrPhone)) {
        await loginWithPhone(formData.emailOrPhone)
        success('OTP sent to your phone!')
        navigate('/otp-verification', {
          state: { phoneNumber: formData.emailOrPhone },
        })
      } else {
        await login(formData.emailOrPhone, formData.password)
        success('Logged in successfully!')
      }
    } catch (err) {
      console.error(err)
      showError('Login failed. Check your credentials or try again.')
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      success('Redirecting to Google login...')
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : undefined
      showError(message || 'Google login failed. Please try again.')
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Log In</h1>
          <p className={styles.subtitle}>Welcome back! Please log in to your account.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email or Phone (+countrycode)"
              type="text"
              placeholder="Enter your email or phone"
              value={formData.emailOrPhone}
              onChange={(e) => handleInputChange('emailOrPhone', e.target.value)}
              error={errors.emailOrPhone}
              fullWidth
              required
            />

            {!/^\+\d{10,15}$/.test(formData.emailOrPhone) && (
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                fullWidth
                required
              />
            )}

            <div className={styles.forgotPassword}>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={isLoading} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleGoogleLogin}
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Redirecting...' : 'Continue with Google'}
            </Button>

            <p className={styles.signupText}>
              Don't have an account?{' '}
              <Link to="/register" className={styles.signupLink}>
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
