import { useState, type FormEvent } from 'react'
import { register } from './api'
import AuthCard, { type ScreenProps } from './AuthCard'
import { validateRegistration, type FieldErrors } from './validation'

const EMAIL_TAKEN = 'An account with this email already exists.'

export default function CreateAccountScreen({ origin, onAuthenticated, onSwitch }: ScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateRegistration(email, password)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setPending(true)
    const result = await register(email, password)
    setPending(false)
    if (result.ok) onAuthenticated(origin === 'checkout' ? 'checkout' : 'account')
    else if (result.kind === 'field') setErrors(result.errors)
  }

  return (
    <AuthCard
      title="Create account"
      note={origin === 'checkout' ? 'Create an account to continue to checkout.' : undefined}
      submitLabel={pending ? 'Creating account…' : 'Create account'}
      pending={pending}
      onSubmit={handleSubmit}
      switchPrompt="Already have an account?"
      switchLabel="Sign in"
      onSwitch={onSwitch}
    >
      <div className="field">
        <label htmlFor="su-email">Email</label>
        <input
          className={`input${errors.email ? ' is-invalid' : ''}`}
          id="su-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'su-email-err' : undefined}
        />
        {errors.email && (
          <p className="field-error" id="su-email-err" role="alert">
            {errors.email}
            {errors.email === EMAIL_TAKEN && (
              <>
                {' '}
                <button className="link-btn" type="button" onClick={onSwitch}>
                  Sign in instead
                </button>
              </>
            )}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="su-pw">Password</label>
        <input
          className={`input${errors.password ? ' is-invalid' : ''}`}
          id="su-pw"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'su-pw-hint su-pw-err' : 'su-pw-hint'}
        />
        <p className="field-hint" id="su-pw-hint">
          At least 8 characters, with a letter and a number.
        </p>
        {errors.password && (
          <p className="field-error" id="su-pw-err" role="alert">
            {errors.password}
          </p>
        )}
      </div>
    </AuthCard>
  )
}
