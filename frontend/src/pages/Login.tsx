import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { getErrorCode, getPasswordResetErrorMessage, getSignInErrorMessage } from '../lib/authErrors'
import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Login() {
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [mode, setMode] = useState<'sign-in' | 'reset'>('sign-in')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resetError, setResetError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(getSignInErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async (event: FormEvent) => {
    event.preventDefault()
    setResetError(null)
    setResetStatus('sending')
    try {
      await resetPassword(email)
      setResetStatus('sent')
    } catch (err) {
      // A nonexistent account gets the exact same "sent" UI as a real one —
      // showing a distinct error here would let someone enumerate which
      // emails have accounts by watching which ones "fail."
      if (getErrorCode(err) === 'auth/user-not-found') {
        setResetStatus('sent')
        return
      }
      setResetStatus('error')
      setResetError(getPasswordResetErrorMessage(err))
    }
  }

  if (mode === 'reset') {
    return (
      <main className="auth-page section-shell">
        <h1>Reset your password</h1>
        {resetStatus === 'sent' ? (
          <div className="contact-form-success" role="status" aria-live="polite">
            <p>If there's an account for {email}, we've sent a password reset link to it.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleReset}>
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {resetError && (
              <p className="auth-error" role="alert">
                {resetError}
              </p>
            )}
            <button className="button button-primary" type="submit" disabled={resetStatus === 'sending'}>
              {resetStatus === 'sending' ? 'Sending…' : 'Send reset email'}
            </button>
          </form>
        )}
        <p>
          <button className="text-link" onClick={() => setMode('sign-in')}>
            Back to sign in
          </button>
        </p>
      </main>
    )
  }

  return (
    <main className="auth-page section-shell">
      <h1>Sign in</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <GoogleSignInButton
          label="Sign in with Google"
          onSuccess={() => navigate('/dashboard')}
          onError={setError}
        />
        <div className="auth-divider" role="separator">
          or sign in with email
        </div>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((show) => !show)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <p>
          <button type="button" className="text-link" onClick={() => setMode('reset')}>
            Forgot password?
          </button>
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </main>
  )
}
