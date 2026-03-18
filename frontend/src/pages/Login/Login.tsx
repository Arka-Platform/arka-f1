import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../contexts/ToastContext'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Login.module.css'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ emailOrPhone?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/home')
    })
  }, [navigate])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: { emailOrPhone?: string; password?: string } = {}

    if (!formData.emailOrPhone) {
      newErrors.emailOrPhone = 'Email or phone is required'
    } else if (
      !/\S+@\S+\.\S+/.test(formData.emailOrPhone) &&
      !/^\+\d{10,15}$/.test(formData.emailOrPhone)
    ) {
      newErrors.emailOrPhone = 'Enter a valid email or phone number (with +countrycode)'
    }

    if (!formData.password && !/^\+\d{10,15}$/.test(formData.emailOrPhone)) {
      // Password only required if email login
      newErrors.password = 'Password is required for email login'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      let data, error
      if (/^\+\d{10,15}$/.test(formData.emailOrPhone)) {
        // Phone login via OTP
        ;({ data, error } = await supabase.auth.signInWithOtp({
          phone: formData.emailOrPhone,
        }))
        if (error) throw error
        success('OTP sent to your phone. Check your messages!')
      } else {
        // Email/password login
        ;({ data, error } = await supabase.auth.signInWithPassword({
          email: formData.emailOrPhone,
          password: formData.password,
        }))
        if (error) throw error
        success('Welcome back! You have successfully logged in.')
        navigate('/home')
      }
    } catch (err) {
      console.error(err)
      showError('Login failed. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) throw error
    } catch (err) {
      console.error(err)
      showError('Google login failed. Please try again.')
    } finally {
      setIsLoading(false)
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
