import { useState } from 'react'
import type { Destination, Origin } from './AuthCard'
import CreateAccountScreen from './CreateAccountScreen'
import SignInScreen from './SignInScreen'

type Props = { origin: Origin; onAuthenticated: (dest: Destination) => void }

export default function AuthFlow({ origin, onAuthenticated }: Props) {
  const [screen, setScreen] = useState<'sign-in' | 'create-account'>('sign-in')
  return screen === 'sign-in' ? (
    <SignInScreen origin={origin} onAuthenticated={onAuthenticated} onSwitch={() => setScreen('create-account')} />
  ) : (
    <CreateAccountScreen origin={origin} onAuthenticated={onAuthenticated} onSwitch={() => setScreen('sign-in')} />
  )
}
