import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <Link className="brand" to="/">
        <img src="/assets/favicon.png" alt="VeraBlock logo" />
        <span>VeraBlock</span>
      </Link>
      <p>Free internet-safety lessons for everyone, taught through video.</p>
      <nav className="footer-legal-links" aria-label="Legal">
        <Link to="/accessibility">Accessibility</Link>
        <Link to="/privacy">Privacy policy</Link>
        <Link to="/terms">Terms of service</Link>
      </nav>
      <small>&copy; {new Date().getFullYear()} VeraBlock.</small>
    </footer>
  )
}
