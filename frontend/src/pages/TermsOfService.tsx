import { useEffect } from 'react'

const PAGE_TITLE = 'Terms of Service | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'
const CONTACT_EMAIL = 'support@verablock.org'

export default function TermsOfService() {
  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  return (
    <main className="legal-page section-shell">
      <h1>Terms of service</h1>

      <div className="legal-draft-notice" role="note">
        <strong>This page is a draft, not published terms.</strong>
        <span>
          The sections below are a scaffold showing what terms of service for this site typically need to cover.
          They are not finished legal text. Please have this reviewed and completed by a lawyer before treating it
          as live, and update the effective date once it is.
        </span>
      </div>

      <h2>Acceptance of terms</h2>
      <p className="legal-todo">
        [Placeholder: state that using VeraBlock means agreeing to these terms, and who may use the service.]
      </p>

      <h2>Description of service</h2>
      <p className="legal-todo">
        [Placeholder: describe what VeraBlock provides — free video lessons, practice quizzes, progress tracking,
        and an in-person course option arranged by email inquiry.]
      </p>

      <h2>Accounts</h2>
      <p className="legal-todo">
        [Placeholder: describe account creation, the user's responsibility for keeping login credentials secure, and
        the right to suspend or terminate accounts for misuse.]
      </p>

      <h2>Acceptable use</h2>
      <p className="legal-todo">
        [Placeholder: describe prohibited conduct on the site, if any is anticipated beyond ordinary account misuse.]
      </p>

      <h2>Course content and intellectual property</h2>
      <p className="legal-todo">
        [Placeholder: state who owns the lesson videos, text, and quiz content, and what a user may or may not do
        with it — e.g., personal, non-commercial use only.]
      </p>

      <h2>Disclaimers</h2>
      <p className="legal-todo">
        [Placeholder: state that lessons are provided for general educational purposes, are not a substitute for
        professional security or legal advice, and are provided "as is" without warranty.]
      </p>

      <h2>Limitation of liability</h2>
      <p className="legal-todo">
        [Placeholder: standard limitation-of-liability language, reviewed by counsel for your jurisdiction.]
      </p>

      <h2>Changes to these terms</h2>
      <p className="legal-todo">[Placeholder: describe how users will be notified of material changes.]</p>

      <h2>Governing law</h2>
      <p className="legal-todo">[Placeholder: state which jurisdiction's law governs these terms.]</p>

      <h2>Contact us</h2>
      <p>
        Questions about these terms can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </main>
  )
}
