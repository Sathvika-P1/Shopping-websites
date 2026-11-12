import { useState } from 'react'
import type { Destination, Origin } from './auth/AuthCard'
import AuthFlow from './auth/AuthFlow'

// Checkout sends signed-out shoppers here with `?from=checkout`; anything else lands on Account.
const origin: Origin = new URLSearchParams(window.location.search).get('from') === 'checkout' ? 'checkout' : 'other'

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
        <button className="btn btn-primary btn-lg auth-submit" type="button" onClick={() => window.location.assign(checkout ? '/checkout' : '/account')}>
          {checkout ? 'Continue to checkout' : 'Go to Account'}
        </button>
      </main>
    )
  }
  return (
    <main>
      <AuthFlow origin={origin} onAuthenticated={setSignedInTo} />
    </main>
  )
}
