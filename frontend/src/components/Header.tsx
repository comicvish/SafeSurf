import { Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useIsAdmin } from '../lib/adminContext'

export default function Header() {
  const { user, signOutUser } = useAuth()
  const { isAdmin } = useIsAdmin()

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="SafeSurf home">
        <img src="/assets/safesurf-logo.png" alt="SafeSurf logo" />
        <span>SafeSurf</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link to="/courses">Courses</Link>
        <Link to="/dashboard">My progress</Link>
        {isAdmin && <Link to="/admin">Admin</Link>}
      </nav>
      {user ? (
        <button className="header-cta" onClick={() => void signOutUser()}>
          Sign out
        </button>
      ) : (
        <Link className="header-cta" to="/login">
          Sign in
        </Link>
      )}
    </header>
  )
}
