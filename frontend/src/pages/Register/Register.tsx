import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Register.module.css'

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const { register, loginWithPhone, loginWithGoogle, isAuthenticated, isLoading } = useAuth()
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

    if (!/^\+\d{10,15}$/.test(formData.emailOrPhone) && !formData.password) {
      newErrors.password = 'Password is required for email signup'
    } else if (formData.password && formData.password.length < 6) {
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
        await loginWithPhone(formData.emailOrPhone)
        success('OTP sent to your phone!')
      } else {
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.emailOrPhone,
          password: formData.password,
        })
        success('Account created successfully!')
        navigate('/home')
      }
    } catch (err) {
      console.error(err)
      showError('Signup failed. Please try again.')
    }
  }

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle()
      success('Redirecting to Google...')
    } catch (err) {
      console.error(err)
      showError('Google signup failed.')
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
