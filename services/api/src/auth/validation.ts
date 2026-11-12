export type FieldErrors = { email?: string; password?: string };
type Input = { email?: unknown; password?: unknown };

/** Trims and lower-cases an email, as it is stored and matched. */
export function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function passwordOf(input: Input): string {
  return typeof input.password === 'string' ? input.password : '';
}

function emailError(input: Input): string | undefined {
  const email = normalizeEmail(input.email);
  if (!email) return 'Enter your email address.';
  if (!email.includes('@')) return 'Enter an email address with an @, like you@example.com.';
  return undefined;
}

function clean(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined));
}

export function validateRegistration(input: Input): FieldErrors {
  const password = passwordOf(input);
  let passwordError: string | undefined;
  if (!password) passwordError = 'Create a password.';
  else if (password.length < 8) passwordError = 'Use at least 8 characters.';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    passwordError = 'Add at least one letter and one number.';
  }
  return clean({ email: emailError(input), password: passwordError });
}

export function validateLogin(input: Input): FieldErrors {
  return clean({
    email: normalizeEmail(input.email) ? undefined : 'Enter your email address.',
    password: passwordOf(input) ? undefined : 'Enter your password.',
  });
}
