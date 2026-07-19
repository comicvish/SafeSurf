import { useEffect } from 'react'

const PAGE_TITLE = 'Privacy Policy | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'
const CONTACT_EMAIL = 'support@verablock.org'

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  return (
    <main className="legal-page section-shell">
      <h1>Privacy policy</h1>

      <div className="legal-draft-notice" role="note">
        <strong>This page is a draft, not a published policy.</strong>
        <span>
          The sections below are a scaffold — placeholders showing what a privacy policy for this site needs to
          cover, based on the data VeraBlock actually collects. They are not finished legal text. Please have this
          reviewed and completed by a lawyer (or a reputable policy-generation service) before treating it as live,
          and update the effective date once it is.
        </span>
      </div>

      <h2>Introduction</h2>
      <p className="legal-todo">
        [Placeholder: state who operates VeraBlock, the effective date of this policy, and that using the site means
        agreeing to it.]
      </p>

      <h2>Information we collect</h2>
      <p className="legal-todo">
        [Placeholder: describe what's actually collected today — account email and password (via Firebase
        Authentication), lesson and quiz progress, and name/email/message submitted through the in-person course
        inquiry form. Note that no analytics or advertising trackers are currently in use.]
      </p>

      <h2>How we use your information</h2>
      <p className="legal-todo">
        [Placeholder: explain the purposes — authenticating users, tracking course progress and streaks/XP, and
        responding to in-person course inquiries by email.]
      </p>

      <h2>Third-party services</h2>
      <p className="legal-todo">
        [Placeholder: disclose the third parties involved in handling user data — Firebase (Google) for
        authentication and hosting, and YouTube for embedded lesson videos (via youtube-nocookie.com). Link to their
        respective privacy policies.]
      </p>

      <h2>Data retention</h2>
      <p className="legal-todo">
        [Placeholder: state how long account and progress data is kept, and what happens to it if an account is
        deleted or inactive.]
      </p>

      <h2>Your rights and choices</h2>
      <p className="legal-todo">
        [Placeholder: describe how a user can access, correct, or delete their data, and who to contact to do so.]
      </p>

      <h2>Children's privacy</h2>
      <p className="legal-todo">
        [Placeholder: state whether the service is intended for use by children under 13, and what happens if it
        isn't.]
      </p>

      <h2>Changes to this policy</h2>
      <p className="legal-todo">[Placeholder: describe how users will be notified of material changes.]</p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </main>
  )
}
