// Mirrors services/api/src/auth/validation.ts so errors show before a round trip; the API stays the source of truth.
export type FieldErrors = { email?: string; password?: string }

function emailError(email: string): string | undefined {
  const value = email.trim()
  if (!value) return 'Enter your email address.'
  if (!value.includes('@')) return 'Enter an email address with an @, like you@example.com.'
  return undefined
}

function compact(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined))
}

export function validateRegistration(email: string, password: string): FieldErrors {
  let passwordError: string | undefined
  if (!password) passwordError = 'Create a password.'
  else if (password.length < 8) passwordError = 'Use at least 8 characters.'
  else if (password.length > 128) passwordError = 'Use at most 128 characters.'
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    passwordError = 'Add at least one letter and one number.'
  }
  return compact({ email: emailError(email), password: passwordError })
}

export function validateLogin(email: string, password: string): FieldErrors {
  return compact({
    email: email.trim() ? undefined : 'Enter your email address.',
    password: password ? undefined : 'Enter your password.',
  })
}
