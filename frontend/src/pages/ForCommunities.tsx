import { Link } from 'react-router-dom'

const CONTACT_EMAIL = 'verablockeducators@gmail.com'
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Interested in the VeraBlock in-person course')}`

const CURRICULUM = [
  {
    week: 'Week 1',
    title: 'Spam Calls & Spam Messages',
    description:
      'Recognizing robocalls, phishing texts, and caller ID spoofing — and what to do the moment one comes in.',
  },
  {
    week: 'Week 2',
    title: 'AI Voices',
    description:
      'How scammers use AI-cloned voices to impersonate family members and trusted contacts, and how to verify before trusting a call.',
  },
  {
    week: 'Week 3',
    title: 'AI Images & Videos',
    description: 'Spotting deepfakes and AI-generated photos and videos used in scams and misinformation.',
  },
  {
    week: 'Week 4',
    title: 'Overall Recap',
    description: 'Reviewing everything covered, answering questions, and building habits that stick.',
  },
]

export default function ForCommunities() {
  return (
    <main className="for-communities">
      <section className="hero-shell">
        <div className="hero">
          <p className="eyebrow">
            <span></span> In-person courses for senior living communities
          </p>
          <h1>Bring internet-safety education to your residents.</h1>
          <p className="hero-text">
            Our team leads a live, four-week course at senior living communities, assisted living facilities, and
            other group settings — no technical experience needed, and no setup required from your staff.
          </p>
          <a className="button button-primary" href={MAILTO}>
            Book a course
          </a>
        </div>
      </section>

      <section className="value-props section-shell">
        <div className="value-prop">
          <h3>Taught in person</h3>
          <p>Our educators come to you and lead every session live — nothing for your community to set up.</p>
        </div>
        <div className="value-prop">
          <h3>Built for today's scams</h3>
          <p>Grounded in the fraud tactics actually targeting seniors right now, not generic internet-safety tips.</p>
        </div>
        <div className="value-prop">
          <h3>Free follow-up resources</h3>
          <p>After the course, residents get free ongoing access to VeraBlock's video lessons to keep learning.</p>
        </div>
      </section>

      <section className="curriculum section-shell">
        <h2>What we teach</h2>
        <p className="course-description">
          One session per week, over four weeks, taught live by our team.
        </p>
        <ol className="curriculum-list">
          {CURRICULUM.map((item) => (
            <li key={item.week} className="curriculum-week">
              <span className="curriculum-week-number">{item.week}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="community-cta">
        <h2>Interested in bringing this course to your community?</h2>
        <p>
          Reach out and we'll work with you on scheduling, group size, and everything else needed to get a course on
          the calendar.
        </p>
        <a className="button button-primary" href={MAILTO}>
          Email {CONTACT_EMAIL}
        </a>
        <p className="community-cta-secondary">
          Looking for the free self-paced lessons instead? <Link to="/courses">Browse courses</Link>
        </p>
      </section>
    </main>
  )
}
