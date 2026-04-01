'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './InstallAppButton.module.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as any
  return window.matchMedia?.('(display-mode: standalone)')?.matches || w.navigator?.standalone === true
}

export default function InstallAppButton({
  variant = 'desktop',
  onInstalled,
}: {
  variant?: 'desktop' | 'mobile'
  onInstalled?: () => void
}) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
      onInstalled?.()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [onInstalled])

  const canInstall = useMemo(() => {
    if (installed) return false
    if (promptEvent) return true
    // iOS Safari doesn’t fire beforeinstallprompt; we show instructions instead.
    return isIos()
  }, [installed, promptEvent])

  const label = variant === 'mobile' ? 'Install App' : 'Install'

  const handleClick = async () => {
    if (installed) return

    if (promptEvent) {
      await promptEvent.prompt()
      try {
        await promptEvent.userChoice
      } finally {
        setPromptEvent(null)
      }
      return
    }

    if (isIos()) {
      setShowIosHelp(true)
    }
  }

  if (!canInstall) return null

  return (
    <>
      <button
        type="button"
        className={variant === 'mobile' ? styles.mobileButton : styles.desktopButton}
        onClick={handleClick}
        aria-label="Install Arka app"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 3v10" />
          <path d="M8 9l4 4 4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <span>{label}</span>
      </button>

      {showIosHelp && (
        <div className={styles.iosBackdrop} role="presentation" onClick={() => setShowIosHelp(false)}>
          <div
            className={styles.iosModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-ios-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.iosHeader}>
              <h3 id="install-ios-title" className={styles.iosTitle}>
                Install Arka
              </h3>
              <button
                type="button"
                className={styles.iosClose}
                aria-label="Close"
                onClick={() => setShowIosHelp(false)}
              >
                ×
              </button>
            </div>

            <ol className={styles.iosSteps}>
              <li>
                Tap the <strong>Share</strong> button in Safari
                <span className={styles.iosIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 16V3" />
                    <path d="M8 7l4-4 4 4" />
                    <path d="M4 21h16" />
                  </svg>
                </span>
              </li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong>.</li>
            </ol>

            <div className={styles.iosFooter}>
              <button type="button" className={styles.iosOk} onClick={() => setShowIosHelp(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

