import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

const CONTACT_EMAIL = 'verablockeducators@gmail.com'
const PAGE_TITLE = 'In-Person Courses | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'

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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SESSION_DAY_INDEX = 1 // Tuesday — arbitrary; the point is "same day, once a week"

export default function ForCommunities() {
  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

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
          <a className="button button-primary" href="#contact">
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
        <p className="course-description">One session per week, over four weeks, taught live by our team.</p>
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

      <section className="schedule section-shell">
        <h2>How it's scheduled</h2>
        <p className="course-description">
          One live session per week, same day and time, for four weeks — here's the rhythm.
        </p>
        <div className="schedule-calendar">
          {DAY_LABELS.map((day) => (
            <div className="schedule-day-label" key={day}>
              {day}
            </div>
          ))}
          {CURRICULUM.flatMap((item) =>
            Array.from({ length: 7 }, (_, day) =>
              day === SESSION_DAY_INDEX ? (
                <div className="schedule-cell session" key={`${item.week}-${day}`}>
                  <span className="schedule-cell-week">{item.week}</span>
                  <span className="schedule-cell-topic">{item.title}</span>
                </div>
              ) : (
                <div className="schedule-cell" key={`${item.week}-${day}`} />
              ),
            ),
          )}
        </div>
      </section>

      <section className="community-cta" id="contact">
        <h2>Interested in bringing this course to your community?</h2>
        <p>
          Tell us a bit about your community and we'll work out scheduling, group size, and everything else needed
          to get a course booked.
        </p>
        <ContactForm />
        <p className="community-cta-secondary">
          Prefer email directly? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p className="community-cta-secondary">
          Looking for the free self-paced lessons instead? <Link to="/courses">Browse courses</Link>
        </p>
      </section>
    </main>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const subject = 'Interested in the VeraBlock in-person course'
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      preferredDate ? `Preferred start date: ${preferredDate}` : null,
      '',
      message,
    ]
      .filter((line) => line !== null)
      .join('\n')

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        Your name
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Your email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Preferred start date <span className="optional">(optional)</span>
        <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
      </label>
      <label>
        Message
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your community and what you're looking for."
        />
      </label>
      <button className="button button-primary" type="submit">
        Send inquiry
      </button>
      <p className="contact-form-note">This opens your email app with your message ready to send.</p>
    </form>
  )
}
