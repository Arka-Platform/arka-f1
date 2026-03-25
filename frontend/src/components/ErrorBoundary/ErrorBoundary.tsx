'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

/**
 * Production-friendly error boundary:
 * - logs to console for debugging
 * - prevents full app white-screen
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Unhandled render error', { error, info })
  }

  render() {
    const { hasError, error } = this.state
    const { fallback } = this.props

    if (hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <p style={{ color: '#666' }}>
            {error?.message ? `Error: ${error.message}` : 'Please refresh the page and try again.'}
          </p>
          {fallback ?? <button onClick={() => window.location.reload()}>Reload</button>}
        </div>
      )
    }

    return this.props.children
  }
}

