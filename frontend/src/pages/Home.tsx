import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="hero-shell">
      <section className="hero">
        <p className="eyebrow">
          <span></span> Free, video-based lessons
        </p>
        <h1>Learn to stay safe online.</h1>
        <p className="hero-text">
          SafeSurf teaches practical internet-security skills through short video lessons, organized into
          courses you can work through at your own pace.
        </p>
        <Link className="button button-primary" to="/courses">
          Browse courses
        </Link>
      </section>
    </main>
  )
}
