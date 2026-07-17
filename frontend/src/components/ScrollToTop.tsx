import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router doesn't reset scroll position on client-side navigation, so
// without this, navigating to a new page keeps whatever scroll offset you
// were at on the previous one — landing you mid-page instead of at the top.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      // The site sets `scroll-behavior: smooth` globally, which would
      // otherwise animate this into an unwanted scroll-up-then-down effect
      // across two different pages' content. Force an instant jump instead.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash])

  return null
}
