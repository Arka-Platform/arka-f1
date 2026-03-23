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
  const { verifyPhoneOtp } = useAuth()
  const { success, error: showError } = useToast()
  const phoneNumber = (location.state as { phoneNumber: string })?.phoneNumber || ''

  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async () => {
    if (!phoneNumber) {
      showError('Phone number missing. Please try again.')
      navigate('/login', { replace: true })
      return
    }

    if (!otp) {
      showError('Please enter the OTP')
      return
    }

    setIsLoading(true)
    try {
      await verifyPhoneOtp(phoneNumber, otp)
      success('Phone verified successfully!')
      navigate('/home')
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Failed to verify OTP'
      showError(message)
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
