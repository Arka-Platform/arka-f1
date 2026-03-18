import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Login.module.css'

const OTPVerification: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()
  const { success, error: showError } = useToast()
  const phoneNumber = (location.state as { phoneNumber: string })?.phoneNumber || ''

  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async () => {
    if (!otp) {
      showError('Please enter the OTP')
      return
    }

    setIsLoading(true)
    try {
      // Supabase OTP verification
      const { data, error } = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/auth/v1/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            phone: phoneNumber,
            token: otp,
          }),
        }
      ).then((res) => res.json())

      if (error) throw new Error(error.message || 'OTP verification failed')

      success('Phone verified successfully!')
      await refreshUser()
      navigate('/home')
    } catch (err: any) {
      console.error(err)
      showError(err.message || 'Failed to verify OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Verify OTP</h1>
          <p className={styles.subtitle}>
            Enter the OTP sent to <strong>{phoneNumber}</strong>
          </p>

          <div className={styles.form}>
            <Input
              label="OTP"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              fullWidth
            />

            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={handleVerify}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTPVerification
