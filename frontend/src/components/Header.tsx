import { Link } from 'react-router-dom'

export default function Header() {
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
      <Link className="header-cta" to="/login">
        Sign in
      </Link>
    </header>
  )
}
