import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { acceptFamilyInvite } from '../lib/api'

export default function FamilyLinkAccept() {
  const { linkId } = useParams<{ linkId: string }>()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!linkId) return
    setStatus('accepting')
    setError(null)
    try {
      await acceptFamilyInvite(linkId)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not accept this invite.')
    }
  }

  if (loading) return <main className="page-status">Loading…</main>

  return (
    <main className="section-shell">
      <h1>Family safety invite</h1>
      {status === 'done' ? (
        <>
          <p>You're linked! Head to your account page to confirm your safe word together once you've agreed on it.</p>
          <Link className="button button-primary" to="/account">
            Go to My Account
          </Link>
        </>
      ) : !user ? (
        <>
          <p>Sign in or create an account first, then come back to this link to accept.</p>
          <div className="admin-assign-actions">
            <Link className="button button-primary" to="/login">
              Sign in
            </Link>
            <Link className="button button-secondary" to="/signup">
              Create an account
            </Link>
          </div>
        </>
      ) : (
        <>
          <p>Accept this invite to link your VeraBlock account with theirs.</p>
          <button className="button button-primary" onClick={() => void handleAccept()} disabled={status === 'accepting'}>
            {status === 'accepting' ? 'Accepting…' : 'Accept invite'}
          </button>
          {status === 'error' && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </main>
  )
}
