import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getOtpCooldownRemainingSeconds, markOtpSentNow } from '../../utils/otpRateLimit'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Register.module.css'

function isExistingAccountError(err: unknown): boolean {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as any).code) : ''
  const message =
    typeof err === 'object' && err !== null && 'message' in err ? String((err as any).message).toLowerCase() : ''

  return (
    code === 'user_already_exists' ||
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('user already')
  )
}

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const { register, loginWithPhone, loginWithEmailOtp, loginWithGoogle, isAuthenticated, isLoading } = useAuth()
  const { success, error: showError } = useToast()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailOrPhone: '',
    password: '',
  })

  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    emailOrPhone?: string
    password?: string
  }>({})

  const isRateLimitError = (err: unknown) => {
    const message = err instanceof Error ? err.message.toLowerCase() : ''
    return message.includes('rate limit')
  }

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) navigate('/home')
  }, [isAuthenticated, navigate])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'

    if (!formData.emailOrPhone) newErrors.emailOrPhone = 'Email or phone is required'
    else if (
      !/\S+@\S+\.\S+/.test(formData.emailOrPhone) &&
      !/^\+\d{10,15}$/.test(formData.emailOrPhone)
    ) {
      newErrors.emailOrPhone = 'Enter a valid email or phone (+countrycode)'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (/^\+\d{10,15}$/.test(formData.emailOrPhone)) {
        const waitSeconds = getOtpCooldownRemainingSeconds('phone', formData.emailOrPhone)
        if (waitSeconds > 0) {
          showError(`Please wait ${waitSeconds}s before requesting another OTP.`)
          return
        }
        await loginWithPhone(formData.emailOrPhone)
        markOtpSentNow('phone', formData.emailOrPhone)
        success('OTP sent to your phone!')
        navigate('/otp-verification', {
          state: { channel: 'phone', value: formData.emailOrPhone },
        })
      } else {
        if (formData.password.trim()) {
          await register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.emailOrPhone,
            password: formData.password,
          })
          success('Account created successfully!')
          navigate('/home')
        } else {
          const waitSeconds = getOtpCooldownRemainingSeconds('email', formData.emailOrPhone)
          if (waitSeconds > 0) {
            showError(`Please wait ${waitSeconds}s before requesting another OTP.`)
            return
          }
          await loginWithEmailOtp(formData.emailOrPhone, {
            mode: 'signup',
            firstName: formData.firstName,
            lastName: formData.lastName,
          })
          markOtpSentNow('email', formData.emailOrPhone)
          success('Magic link sent. Please check your email and open the link.')
          navigate('/login', {
            replace: true,
            state: { prefillEmailOrPhone: formData.emailOrPhone },
          })
        }
      }
    } catch (err) {
      console.error(err)
      if (isRateLimitError(err)) {
        showError('Too many OTP requests. Please wait a minute and try again.')
        return
      }
      if (isExistingAccountError(err)) {
        showError('Account already exists. Please log in.')
        navigate('/login', {
          replace: true,
          state: { prefillEmailOrPhone: formData.emailOrPhone },
        })
        return
      }
      showError('Signup failed. Please try again.')
    }
  }

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle()
      success('Redirecting to Google...')
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : undefined
      showError(message || 'Google signup failed.')
    }
  }

  return (
    <div className={styles.signup}>
      <div className={styles.container}>
        <div className={styles.signupCard}>
          <h1 className={styles.title}>Sign Up</h1>
          <p className={styles.subtitle}>Create your account to get started.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="First Name"
              type="text"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={errors.firstName}
              fullWidth
              required
            />

            <Input
              label="Last Name"
              type="text"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={errors.lastName}
              fullWidth
              required
            />

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
                label="Password (optional for email OTP signup)"
                type="password"
                placeholder="Enter password or leave blank to use email OTP"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                fullWidth
              />
            )}

            <Button type="submit" variant="primary" fullWidth loading={isLoading} disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleGoogleSignup}
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Redirecting...' : 'Continue with Google'}
            </Button>

            <p className={styles.loginText}>
              Already have an account?{' '}
              <Link to="/login" className={styles.loginLink}>
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Signup
