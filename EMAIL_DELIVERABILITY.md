# Fixing Firebase Auth email deliverability (spam classification)

## Status: interim fix live (2026-07-18)

Firebase Auth's transactional emails (password reset, verify email, etc.) now send via **custom
SMTP through the existing `verablockeducators@gmail.com` account** (the same one already used for
in-person-course inquiry emails), wired up via the Identity Toolkit Admin API
(`notification.sendEmail.method = CUSTOM_SMTP`, `smtp.host = smtp.gmail.com`). This uses Gmail's
own authenticated sending infrastructure (real SPF/DKIM under `gmail.com`), which should land in
the inbox far more reliably than the previous shared `firebaseapp.com` sender — with no new signup
or DNS changes required.

**Known limits of this interim fix, worth revisiting later:**
- Emails come from `verablockeducators@gmail.com`, not `noreply@verablock.org` — less polished
  branding, and the display name shows as "VeraBlock" but the address itself is a personal Gmail.
- Consumer Gmail accounts have a **~500 email/day sending cap**. Fine for current volume; would
  need Option B below before any real growth in signups/password resets.
- Google's abuse detection can occasionally flag a personal Gmail account used as an automated
  SMTP relay from a server. Low risk at current volume, but worth knowing.

Option B (a real transactional provider on `verablock.org`) below remains the correct long-term
fix once it's worth the setup effort.

## Why this is happening

Every Firebase Auth email (password reset, email verification, etc.) is currently sent from
`noreply@safesurf-learn.firebaseapp.com` — a domain shared across every Firebase project on the
planet that hasn't configured otherwise. Confirmed via the live project config:

```
"callbackUri": "https://safesurf-learn.firebaseapp.com/__/auth/action",
"dnsInfo": { "customDomainState": "NOT_STARTED" }
```

Because that sending domain isn't `verablock.org`, and `verablock.org` has no SPF/DKIM/DMARC
records authorizing Firebase (or anyone) to send mail as it, receiving mail servers have no way
to verify the email is legitimate. Combined with the generic `noreply@` sender and a huge shared
volume of mail from that domain (all Firebase projects that haven't customized it), it reads as a
textbook spam pattern to Gmail's filters.

There is no code fix for this — it's entirely a matter of authenticated sending infrastructure and
DNS. This can't be done from here: it requires DNS access to `verablock.org` (a domain registrar
or DNS host login) that I don't have.

## The real fix, in order

### Option A — Custom domain for Firebase's own email action links (partial fix, do this regardless)

Firebase lets you serve the password-reset/verify-email action links from `verablock.org` instead
of `safesurf-learn.firebaseapp.com`, via **Firebase Console → Authentication → Settings →
Authorized domains**, then **Authentication → Templates → customize action URL**. This changes
what the *link* points to, which helps trust signals and looks more legitimate to the recipient —
but it does **not** change the sending mail server, so it alone won't fix spam classification. Do
this as a quick win either way, but pair it with Option B.

### Option B — Custom SMTP with a verified sending domain (the actual fix)

Firebase Auth supports a **custom SMTP server** for its transactional emails:
**Firebase Console → Authentication → Templates → SMTP settings → Enable custom SMTP**.

Pick one:

1. **A transactional email provider** (recommended) — SendGrid, Postmark, Amazon SES, or Resend.
   All of them:
   - Verify domain ownership (a TXT record in `verablock.org`'s DNS).
   - Give you SPF and DKIM records to add to `verablock.org`'s DNS (they generate the exact
     records; you paste them into your DNS host — Namecheap, GoDaddy, Cloudflare, wherever
     `verablock.org` is managed).
   - Give you SMTP credentials to plug into Firebase's custom SMTP settings (host, port, username,
     password).
   - Postmark and SES both have solid reputations specifically for *transactional* mail (password
     resets, receipts) — better default deliverability than bulk-marketing-oriented providers.

2. **Google Workspace**, if VeraBlock ever sets one up for `verablock.org` (e.g.
   `noreply@verablock.org` as a real mailbox) — same idea, Google publishes the SPF/DKIM records
   for you, and you'd use `smtp.gmail.com` as the custom SMTP host. This is the same mechanism the
   backend already uses for the in-person-course inquiry emails (`GMAIL_USER` /
   `GMAIL_APP_PASSWORD` in `backend/src/services/email.ts`), just for a `verablock.org` mailbox
   instead of a plain Gmail one, and used for Firebase Auth's config rather than the backend's own
   SMTP call.

### Minimum concrete steps once a provider is chosen (example: Postmark)

1. Sign up, add `verablock.org` as a sending domain.
2. Add the SPF and DKIM TXT/CNAME records Postmark gives you to `verablock.org`'s DNS zone.
3. Wait for verification (usually minutes to a few hours for DNS propagation).
4. Create an SMTP token in Postmark.
5. Firebase Console → Authentication → Templates → SMTP settings:
   - Host: `smtp.postmarkapp.com` (or your provider's SMTP host)
   - Port: `587`
   - Username / Password: the SMTP token Postmark gives you
   - From address: `noreply@verablock.org` (must match the verified sending domain)
6. Send a real test password reset and confirm it lands in the inbox, not spam.

### What I can do once DNS access is available

If someone gets access to `verablock.org`'s DNS (or shares the records with me to relay), I can:
- Help pick and configure the provider.
- Draft the exact DNS records to add.
- Wire up the Firebase custom SMTP settings via the same Admin API access I already have for this
  project, once the SMTP credentials exist.

None of that is possible without the domain access, so this file is the handoff point.
