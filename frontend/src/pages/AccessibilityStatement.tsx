import { useEffect } from 'react'

const PAGE_TITLE = 'Accessibility | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'
const CONTACT_EMAIL = 'verablockeducators@gmail.com'
const LAST_UPDATED = 'July 17, 2026'

export default function AccessibilityStatement() {
  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  return (
    <main className="legal-page section-shell">
      <h1>Accessibility statement</h1>
      <p className="legal-updated">Last updated {LAST_UPDATED}</p>

      <p>
        VeraBlock teaches internet safety to seniors, so an interface that's genuinely usable by older adults and
        people using assistive technology isn't a side concern for us — it's the point. We aim to meet{' '}
        <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noreferrer">
          WCAG 2.1 Level AA
        </a>{' '}
        across the site, and we treat accessibility as ongoing work rather than a box we checked once.
      </p>

      <h2>What we've built in</h2>
      <ul>
        <li>Semantic HTML and landmark structure (lists marked up as lists, headings in order, a labeled main navigation) so screen readers can navigate the site predictably.</li>
        <li>Status and error messages are announced to assistive technology as they appear, instead of relying on sight alone to notice them.</li>
        <li>Quiz questions use proper grouped-choice semantics, and correct/incorrect answers are marked with an icon and hidden text label, not color alone.</li>
        <li>Every interactive control has a visible focus outline, and focus is moved deliberately when content changes (for example, to the next question in a practice quiz) so keyboard users always know where they are.</li>
        <li>Loading states are announced to screen readers rather than left silent, and decorative placeholder content is hidden from assistive technology.</li>
        <li>All animation on the site respects your operating system's "reduce motion" setting — turning it on switches every transition to instant.</li>
        <li>Images carry meaningful alt text, or are marked purely decorative when adjacent text already describes them.</li>
        <li>Color is never the only signal for meaning — errors, success states, and quiz feedback all pair color with an icon, label, or text.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        This site has not yet been through a formal third-party accessibility audit or manual testing with a range of
        assistive technologies and real users. We've built against WCAG 2.1 AA criteria and continue to review the
        site against them, but we can't yet claim certified compliance — if you run into a barrier, we want to know
        about it and fix it.
      </p>

      <h2>Let us know</h2>
      <p>
        If you use assistive technology and hit a problem anywhere on VeraBlock, or if something described above
        isn't holding up the way it should, please tell us. Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the page you were on and what happened — we read
        every message.
      </p>
    </main>
  )
}
