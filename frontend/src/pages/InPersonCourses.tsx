import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sendInquiry } from '../lib/api'

const CONTACT_EMAIL = 'hello@verablock.org'
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

const HIGHLIGHTS = [
  'Taught in person by our team',
  'Grounded in today’s actual scams',
  'Free follow-up lessons included',
]

export default function InPersonCourses() {
  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  return (
    <main className="in-person-courses">
      <section className="schedule-hero section-shell">
        <p className="eyebrow">
          <span aria-hidden="true"></span> In-person courses for senior living communities
        </p>
        <h1>The full four-week schedule.</h1>
        <p className="schedule-hero-text">
          Our team leads one live session a week, for four weeks — you tell us the day and time that works for your
          community, and we build the course around it. No technical experience needed, and nothing for your staff
          to set up.
        </p>
        <p className="schedule-hero-alt-link">
          Looking for the free self-paced lessons instead? <Link to="/courses">Browse courses</Link>
        </p>
      </section>

      <section className="curriculum-detail section-shell">
        <h2>What each week covers</h2>
        <p className="curriculum-detail-note">
          One live session a week, same day and time, for four weeks — day and time are entirely up to you. Email us
          and we'll schedule it around your community's calendar.
        </p>
        <dl className="curriculum-detail-list">
          {CURRICULUM.map((item) => (
            <div className="curriculum-detail-row" key={item.week}>
              <dt>
                <span className="curriculum-week-number">{item.week}</span> {item.title}
              </dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="highlights-band section-shell">
        <ul className="inline-highlights">
          {HIGHLIGHTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a className="button button-primary" href="#contact">
          Request this course
        </a>
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
      </section>
    </main>
  )
}

type SubmitStatus = 'idle' | 'sending' | 'sent' | 'error'

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    sendInquiry({ name, email, preferredDate: preferredDate || undefined, message })
      .then(() => {
        setStatus('sent')
        setName('')
        setEmail('')
        setPreferredDate('')
        setMessage('')
      })
      .catch((err: unknown) => {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      })
  }

  if (status === 'sent') {
    return (
      <div className="contact-form-success" role="status" aria-live="polite">
        <p>Thanks — your message is on its way to us. We'll get back to you soon.</p>
      </div>
    )
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
      <button className="button button-primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send inquiry'}
      </button>
      {status === 'error' && (
        <p className="contact-form-error" role="alert">
          {errorMessage}
        </p>
      )}
      <p className="contact-form-note">We'll email you back at the address you provide.</p>
    </form>
  )
}
