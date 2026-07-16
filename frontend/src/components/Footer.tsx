import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <Link className="brand" to="/">
        <img src="/assets/safesurf-logo.png" alt="SafeSurf logo" />
        <span>SafeSurf</span>
      </Link>
      <p>Free internet-safety lessons for everyone, taught through video.</p>
      <small>&copy; {new Date().getFullYear()} SafeSurf.</small>
    </footer>
  )
}
