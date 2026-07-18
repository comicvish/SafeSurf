import { useState } from 'react'
import { useAuth } from '../lib/authContext'
import { getAppleSignInErrorMessage, getErrorCode } from '../lib/authErrors'

interface AppleSignInButtonProps {
  label: string
  onSuccess: () => void
  onError: (message: string) => void
}

export default function AppleSignInButton({ label, onSuccess, onError }: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const handleClick = async () => {
    setSubmitting(true)
    try {
      await signInWithApple()
      onSuccess()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      onError(getAppleSignInErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      className="apple-signin-button"
      onClick={() => void handleClick()}
      disabled={submitting}
    >
      <svg className="apple-signin-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9 7.31c1.33.07 2.26.73 3.04.78 1.17-.24 2.29-.93 3.53-.84 1.49.12 2.61.71 3.35 1.78-3.08 1.85-2.35 5.91.48 7.05-.56 1.48-1.29 2.95-2.36 4.19ZM11.94 7.24C11.79 5.04 13.58 3.23 15.63 3c.28 2.54-2.3 4.49-3.69 4.24Z" />
      </svg>
      {submitting ? 'Signing in…' : label}
    </button>
  )
}
