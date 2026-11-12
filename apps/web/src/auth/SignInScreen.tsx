import { useRef, useState, type FormEvent } from 'react'
import { login } from './api'
import AuthCard, { type ScreenProps } from './AuthCard'
import { validateLogin, type FieldErrors } from './validation'

export default function SignInScreen({ origin, onAuthenticated, onSwitch }: ScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [failed, setFailed] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [pending, setPending] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateLogin(email, password)
    setErrors(found)
    setFailed(false)
    setUnavailable(false)
    if (Object.keys(found).length > 0) return

    setPending(true)
    const result = await login(email, password)
    setPending(false)
    if (result.ok) {
      onAuthenticated(origin === 'checkout' ? 'checkout' : 'account')
    } else if (result.kind === 'field') {
      setErrors(result.errors)
    } else if (result.kind === 'network') {
      setUnavailable(true)
    } else {
      setFailed(true)
      setPassword('')
      passwordRef.current?.focus()
    }
  }

  return (
    <AuthCard
      title="Sign in"
      note={origin === 'checkout' ? 'Sign in to continue to checkout.' : undefined}
      banner={
        (failed || unavailable) && (
          <div className="alert alert-danger" role="alert">
            {failed
              ? 'The email or password is not right. Try again.'
              : 'Something went wrong and you were not signed in. Try again.'}
          </div>
        )
      }
      submitLabel={pending ? 'Signing in…' : 'Sign in'}
      pending={pending}
      onSubmit={handleSubmit}
      switchPrompt="New here?"
      switchLabel="Create an account"
      onSwitch={onSwitch}
    >
      <div className="field">
        <label htmlFor="si-email">Email</label>
        <input
          className={`input${errors.email || failed ? ' is-invalid' : ''}`}
          id="si-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email || failed ? true : undefined}
          aria-describedby={errors.email ? 'si-email-err' : undefined}
        />
        {errors.email && (
          <p className="field-error" id="si-email-err" role="alert">
            {errors.email}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="si-pw">Password</label>
        <input
          className={`input${errors.password || failed ? ' is-invalid' : ''}`}
          id="si-pw"
          type="password"
          autoComplete="current-password"
          ref={passwordRef}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={errors.password || failed ? true : undefined}
          aria-describedby={errors.password ? 'si-pw-err' : undefined}
        />
        {errors.password && (
          <p className="field-error" id="si-pw-err" role="alert">
            {errors.password}
          </p>
        )}
      </div>
    </AuthCard>
  )
}
