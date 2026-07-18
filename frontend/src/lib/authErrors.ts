export function getErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return (err as { code: string }).code
  }
  return ''
}

export function getSignInErrorMessage(err: unknown): string {
  switch (getErrorCode(err)) {
    // Deliberately identical for "no account" and "wrong password" — a
    // distinct message for either lets an attacker enumerate which emails
    // have accounts. One generic message for both, same as most sign-in
    // forms use.
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Check both and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "We couldn't reach the server. Check your connection and try again."
    default:
      return 'Could not sign in with those details. Please try again.'
  }
}

export function getSignUpErrorMessage(err: unknown): string {
  switch (getErrorCode(err)) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in instead.'
    case 'auth/invalid-email':
      return "That email address doesn't look right. Check for typos and try again."
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Password needs at least 8 characters, with an uppercase letter, a lowercase letter, and a number.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "We couldn't reach the server. Check your connection and try again."
    default:
      return 'Could not create an account. Please try again.'
  }
}

// Callers should treat `auth/popup-closed-by-user` and
// `auth/cancelled-popup-request` as a silent no-op, not call this with them —
// the user just closed the Google window or double-clicked the button, not
// an error worth surfacing.
export function getGoogleSignInErrorMessage(err: unknown): string {
  switch (getErrorCode(err)) {
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account with that email already exists. Sign in with your email and password instead.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "We couldn't reach the server. Check your connection and try again."
    default:
      return 'Could not sign in with Google. Please try again.'
  }
}

// Callers should treat `auth/user-not-found` as success, not call this with
// it — see Login.tsx's reset handler. Surfacing "no account with that email"
// here would let an attacker enumerate which emails are registered.
export function getPasswordResetErrorMessage(err: unknown): string {
  switch (getErrorCode(err)) {
    case 'auth/invalid-email':
      return "That email address doesn't look right. Check for typos and try again."
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "We couldn't reach the server. Check your connection and try again."
    default:
      return 'Could not send a reset email. Please try again.'
  }
}
