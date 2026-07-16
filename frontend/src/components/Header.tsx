import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useIsAdmin } from '../lib/adminContext'
import { useStats } from '../lib/statsContext'

export default function Header() {
  const { user, signOutUser } = useAuth()
  const { isAdmin } = useIsAdmin()
  const { stats } = useStats()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="VeraBlock home" onClick={() => setMenuOpen(false)}>
        <img src="/assets/favicon.png" alt="VeraBlock logo" />
        <span>VeraBlock</span>
      </Link>
      <button
        className="menu-toggle"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav id="main-navigation" aria-label="Main navigation" className={menuOpen ? 'open' : undefined}>
        {user && (
          <span className="header-stats" aria-label={`${stats.currentStreak} day streak, ${stats.xp} XP`}>
            🔥 {stats.currentStreak} · {stats.xp} XP
          </span>
        )}
        <Link to="/courses" onClick={() => setMenuOpen(false)}>
          Courses
        </Link>
        <Link to="/for-communities" onClick={() => setMenuOpen(false)}>
          For Communities
        </Link>
        <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
          My progress
        </Link>
        {isAdmin && (
          <Link to="/admin" onClick={() => setMenuOpen(false)}>
            Admin
          </Link>
        )}
        {user ? (
          <button
            className="header-cta"
            onClick={() => {
              setMenuOpen(false)
              void signOutUser()
            }}
          >
            Sign out
          </button>
        ) : (
          <Link className="header-cta" to="/login" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
        )}
      </nav>
    </header>
  )
}
