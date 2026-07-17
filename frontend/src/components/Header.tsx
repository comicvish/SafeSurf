import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useIsAdmin } from '../lib/adminContext'
import { useStats } from '../lib/statsContext'

export default function Header() {
  const { user } = useAuth()
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
        <div className="nav-inner">
          {user && (
            <span className="header-stats" aria-label={`${stats.currentStreak} day streak, ${stats.xp} XP`}>
              {stats.currentStreak}-day streak · {stats.xp} XP
            </span>
          )}
          <NavLink to="/courses" onClick={() => setMenuOpen(false)}>
            Courses
          </NavLink>
          <NavLink to="/in-person-courses" onClick={() => setMenuOpen(false)}>
            In-Person Courses
          </NavLink>
          <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
            My progress
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
              Admin
            </NavLink>
          )}
          {user ? (
            <NavLink className="header-cta" to="/account" onClick={() => setMenuOpen(false)}>
              My Account
            </NavLink>
          ) : (
            <Link className="header-cta" to="/login" onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
