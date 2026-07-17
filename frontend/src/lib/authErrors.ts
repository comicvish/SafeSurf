function codeOf(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return (err as { code: string }).code
  }
  return ''
}

export function getSignInErrorMessage(err: unknown): string {
  switch (codeOf(err)) {
    case 'auth/invalid-email':
      return "That email address doesn't look right. Check for typos and try again."
    case 'auth/user-not-found':
      return "We couldn't find an account with that email. Check the address, or sign up instead."
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "Email or password doesn't match. Check both, or reset your password below."
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "We couldn't reach the server. Check your connection and try again."
    default:
      return 'Could not sign in with those details. Please try again.'
  }
}

export function getSignUpErrorMessage(err: unknown): string {
  switch (codeOf(err)) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in instead.'
    case 'auth/invalid-email':
      return "That email address doesn't look right. Check for typos and try again."
    case 'auth/weak-password':
      return 'Password needs at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "We couldn't reach the server. Check your connection and try again."
    default:
      return 'Could not create an account. Please try again.'
  }
}

export function getPasswordResetErrorMessage(err: unknown): string {
  switch (codeOf(err)) {
    case 'auth/invalid-email':
      return "That email address doesn't look right. Check for typos and try again."
    case 'auth/user-not-found':
      return "We couldn't find an account with that email."
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "We couldn't reach the server. Check your connection and try again."
    default:
      return 'Could not send a reset email. Please try again.'
  }
}
