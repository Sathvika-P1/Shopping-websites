import { useState } from 'react'
import type { Destination } from './auth/AuthCard'
import AuthFlow from './auth/AuthFlow'

export default function App() {
  const [signedInTo, setSignedInTo] = useState<Destination | null>(null)

  if (signedInTo) {
    const checkout = signedInTo === 'checkout'
    return (
      <main className="card auth-card auth-success stack" role="status">
        <span className="mark" aria-hidden="true">
          ✓
        </span>
        <h2>You’re signed in</h2>
        <p>Taking you to {checkout ? 'checkout' : 'Account'}…</p>
        <div>
          <span className="spinner" aria-hidden="true" />
        </div>
        <button className="btn btn-primary btn-lg auth-submit" type="button">
          {checkout ? 'Continue to checkout' : 'Go to Account'}
        </button>
      </main>
    )
  }
  return (
    <main>
      <AuthFlow origin="other" onAuthenticated={setSignedInTo} />
    </main>
  )
}
