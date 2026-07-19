# Automatic Instagram posting for new lessons

## What's already built

Whenever an admin assigns a video to a lesson (`POST /admin/lessons`), the backend now:
1. Generates an Instagram caption with Gemini (`backend/src/services/instagram.ts`,
   `generateInstagramCaption`) from the lesson/course/unit title and summary.
2. Posts it to Instagram using the lesson's YouTube thumbnail as the image
   (`publishInstagramPost`), via the Instagram Graph API's Content Publishing endpoints.

This is **best-effort**, same pattern as quiz generation: if Instagram isn't configured yet, or
the post fails for any reason, lesson creation still succeeds — `instagramPosted: false` comes
back in the API response and the admin UI says so, but nothing blocks.

## Cost: $0

- The Instagram Graph API itself has no charge for publishing posts.
- Caption generation reuses the same free-tier Gemini key already set up for quiz generation
  (the `verablock-gemini-free` project, no billing account attached).
- The post image is the YouTube thumbnail URL Instagram fetches directly — no image hosting or
  generation cost.
- This code runs inside the existing Cloud Run service — no new infrastructure.

## What you need to do (requires your own Meta/Instagram login — I can't do this part)

1. Confirm the VeraBlock Instagram account is a **Business or Creator** (professional) account.
2. Go to [developers.facebook.com](https://developers.facebook.com) → create a Meta Developer
   account if you don't have one → **Create App** → choose a use case that includes the
   **Instagram** product (look for "Instagram API with Instagram Login" — this is the path that
   does *not* require linking a Facebook Page).
3. In the app's Instagram product settings, connect the VeraBlock Instagram account (you'll log
   into Instagram directly and grant permission — no Facebook Page needed).
4. Because you're posting to an account you own, this only needs **Standard Access** — no Meta
   App Review, no waiting weeks for approval.
5. Generate a long-lived access token for the connected account, and note the Instagram Business
   Account's numeric user ID (shown in the same settings screen).

Once you have both values, send them to me and I'll:
- Store them in Secret Manager (same pattern as the Gemini/Postmark credentials).
- Wire `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_BUSINESS_ACCOUNT_ID` into `cloudbuild.yaml`'s
  `--set-secrets`.
- Test a real post before it goes live for real lesson creation.

## The one ongoing thing to know

Long-lived Instagram/Facebook access tokens expire — typically around **60 days**. When it
expires, `instagramPosted` will start coming back `false` on every new lesson (silently, from an
admin's point of view — it doesn't block lesson creation, it just stops posting) until the token
is refreshed. Worth checking back on this periodically, or I can add an explicit low-token-life
warning to the admin UI later if that'd help.
