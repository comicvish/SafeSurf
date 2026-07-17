import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useStats } from '../lib/statsContext'
import { deleteAccount } from '../lib/api'

const PAGE_TITLE = 'My Account | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'

function formatJoinDate(iso: string | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function MyAccount() {
  const { user, signOutUser, resetPassword } = useAuth()
  const { stats } = useStats()
  const navigate = useNavigate()

  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')

  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  const handleSendReset = async () => {
    if (!user?.email) return
    setResetStatus('sending')
    try {
      await resetPassword(user.email)
      setResetStatus('sent')
    } catch {
      setResetStatus('error')
    }
  }

  const handleDelete = async () => {
    setDeleteStatus('deleting')
    try {
      await deleteAccount()
      await signOutUser()
      navigate('/')
    } catch {
      setDeleteStatus('error')
    }
  }

  const joinDate = formatJoinDate(user?.metadata.creationTime)

  return (
    <main className="account-page section-shell">
      <h1>My Account</h1>

      <section className="account-section">
        <h2>Account details</h2>
        <dl className="account-detail-list">
          <div>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
          {joinDate && (
            <div>
              <dt>Member since</dt>
              <dd>{joinDate}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="account-section">
        <h2>Your progress</h2>
        <div className="stats-row">
          <div className="stat-tile">
            <strong>{stats.xp}</strong>
            <span>Total XP</span>
          </div>
          <div className="stat-tile">
            <strong>{stats.currentStreak}</strong>
            <span>Day streak</span>
          </div>
          <div className="stat-tile">
            <strong>{stats.longestStreak}</strong>
            <span>Longest streak</span>
          </div>
        </div>
      </section>

      <section className="account-section">
        <h2>Security</h2>
        <p>Send yourself a link to set a new password.</p>
        {resetStatus === 'sent' ? (
          <p className="account-status" role="status" aria-live="polite">
            Check {user?.email} for a password reset link.
          </p>
        ) : (
          <button className="button button-secondary" onClick={handleSendReset} disabled={resetStatus === 'sending'}>
            {resetStatus === 'sending' ? 'Sending…' : 'Send password reset email'}
          </button>
        )}
        {resetStatus === 'error' && (
          <p className="auth-error" role="alert">
            Couldn't send the reset email — try again.
          </p>
        )}
      </section>

      <section className="account-section account-danger-zone">
        <h2>Account actions</h2>
        <div className="account-danger-row">
          <div>
            <strong>Sign out</strong>
            <p>Sign out of VeraBlock on this device.</p>
          </div>
          <button className="button button-secondary" onClick={() => void signOutUser()}>
            Sign out
          </button>
        </div>

        <div className="account-danger-row">
          <div>
            <strong>Delete account</strong>
            <p>Permanently deletes your account, progress, and quiz history. This can't be undone.</p>
          </div>
          {!confirmingDelete ? (
            <button className="button button-danger" onClick={() => setConfirmingDelete(true)}>
              Delete account
            </button>
          ) : (
            <div className="account-delete-confirm">
              <p className="auth-error" role="alert">
                Are you sure? This will permanently delete your account and can't be undone.
              </p>
              <div className="account-delete-confirm-actions">
                <button
                  className="button button-danger"
                  onClick={() => void handleDelete()}
                  disabled={deleteStatus === 'deleting'}
                >
                  {deleteStatus === 'deleting' ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleteStatus === 'deleting'}
                >
                  Cancel
                </button>
              </div>
              {deleteStatus === 'error' && (
                <p className="auth-error" role="alert">
                  Couldn't delete your account — try again.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
