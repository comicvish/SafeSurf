import { Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export default function Header() {
  const { user, signOutUser } = useAuth()

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="SafeSurf home">
        <img src="/assets/safesurf-logo.png" alt="SafeSurf logo" />
        <span>SafeSurf</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link to="/courses">Courses</Link>
        <Link to="/dashboard">My progress</Link>
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
