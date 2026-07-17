import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const PAGE_TITLE = 'Page not found | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'

export default function NotFound() {
  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  return (
    <main className="coming-soon">
      <h1>Page not found</h1>
      <p>We couldn't find that page — it may have moved, or the link may be out of date.</p>
      <Link className="button button-primary" to="/">
        Back to home
      </Link>
      <p>
        Looking for a lesson? <Link to="/courses">Browse courses</Link>
      </p>
    </main>
  )
}
