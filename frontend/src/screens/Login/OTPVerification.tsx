import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getOtpCooldownRemainingSeconds, markOtpSentNow } from '../../utils/otpRateLimit'
import Input from '../../components/shared/Input/Input'
import Button from '../../components/shared/Button/Button'
import styles from './Login.module.css'

const OTPVerification: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyPhoneOtp, loginWithPhone } = useAuth()
  const { success, error: showError } = useToast()
  const otpContext =
    (location.state as { channel?: 'phone' | 'email'; value?: string } | null) ?? null
  const channel = otpContext?.channel
  const value = otpContext?.value ?? ''
  const isPhone = channel === 'phone'
  const isEmail = channel === 'email'

  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async () => {
    if (!isPhone && !isEmail) {
      showError('OTP context missing. Please try again.')
      navigate('/login', { replace: true })
      return
    }

    if (isEmail) {
      showError('Email sign-in uses magic link. Please open the link from your email inbox.')
      navigate('/login', { replace: true })
      return
    }

    if (!otp) {
      showError('Please enter the OTP')
      return
    }

    setIsLoading(true)
    try {
      await verifyPhoneOtp(value, otp)
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

  const handleResend = async () => {
    if (!value) {
      showError('Missing destination. Please retry login.')
      navigate('/login', { replace: true })
      return
    }

    const waitSeconds = getOtpCooldownRemainingSeconds('phone', value)
    if (waitSeconds > 0) {
      showError(`Please wait ${waitSeconds}s before requesting another OTP.`)
      return
    }

    setIsResending(true)
    try {
      await loginWithPhone(value)
      markOtpSentNow('phone', value)
      success('OTP sent again.')
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Failed to resend OTP'
      showError(message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Verify OTP</h1>
          <p className={styles.subtitle}>
            Enter the OTP sent to <strong>{value}</strong>
          </p>
          {isEmail && <p className={styles.subtitle}>Email login uses magic link; OTP code is not required.</p>}

          <div className={styles.form}>
            {isPhone && (
              <Input
                label="OTP"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                fullWidth
              />
            )}

            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={handleVerify}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : isPhone ? 'Verify OTP' : 'Back to Login'}
            </Button>
            {isPhone && (
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleResend}
                loading={isResending}
                disabled={isResending || isLoading}
              >
                {isResending ? 'Resending...' : 'Resend OTP'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTPVerification
