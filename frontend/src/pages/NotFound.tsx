import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="coming-soon">
      <h1>Page not found</h1>
      <p>We couldn't find that page.</p>
      <Link className="button button-primary" to="/">
        Back to home
      </Link>
    </main>
  )
}
