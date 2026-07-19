# Fixing Firebase Auth email deliverability (spam classification)

## Status: fixed (2026-07-18)

Firebase Auth's transactional emails (password reset, verify email, etc.) now send via **Postmark**,
with `verablock.org` verified as the sending domain (DKIM + Return-Path records live in Cloudflare
DNS). Wired up via the Identity Toolkit Admin API
(`notification.sendEmail.method = CUSTOM_SMTP`, `smtp.host = smtp.postmarkapp.com`,
`senderEmail = "VeraBlock <noreply@verablock.org>"`). Confirmed working with a real end-to-end test
send before switching the live config over.

This supersedes an earlier interim fix (routing through the personal
`verablockeducators@gmail.com` account's SMTP) that was live for a few hours on the same day —
that interim step is why the git history has two email-related commits close together.

Postmark's free tier (100 emails/month, no expiration) covers current volume with room to spare;
see the pricing note in Option B below if volume ever grows past that.

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

There was no code fix for this — it was entirely a matter of authenticated sending infrastructure
and DNS, which is why this took DNS access (now available via Cloudflare) to actually resolve.

## The fix that was applied

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

### What was actually done

1. Signed up for Postmark, created a Server named "VeraBlock".
2. Added `verablock.org` as a sending domain (Sender Signatures → Add Domain).
3. Added the DKIM TXT record and Return-Path CNAME (`pm_bounces` → `pm.mtasv.net`) Postmark
   generated to `verablock.org`'s DNS zone in Cloudflare — CNAME set to DNS-only (not proxied),
   same gotcha hit earlier with `auth.verablock.org`.
4. Verified with a real end-to-end SMTP test send (`noreply@verablock.org` → a real inbox) before
   touching the live Firebase config.
5. Wired Firebase Auth's custom SMTP settings via the Identity Toolkit Admin API — no Console
   click-through needed, same mechanism used for the interim Gmail fix.

### If email volume ever outgrows Postmark's free tier

Postmark's free tier is 100 emails/month, permanently. Past that, cheapest paid plan is
$15/month for 10,000 emails. Amazon SES is the cheaper alternative at real volume ($0.10/1,000
emails, pay-as-you-go) but requires setting up a separate AWS account.
