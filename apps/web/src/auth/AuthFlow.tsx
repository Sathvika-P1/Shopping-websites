import { useEffect, useRef, useState } from 'react'
import type { Destination, Origin } from './AuthCard'
import CreateAccountScreen from './CreateAccountScreen'
import SignInScreen from './SignInScreen'

type Props = { origin: Origin; onAuthenticated: (dest: Destination) => void }

export default function AuthFlow({ origin, onAuthenticated }: Props) {
  const [screen, setScreen] = useState<'sign-in' | 'create-account'>('sign-in')
  const wrapper = useRef<HTMLDivElement>(null)
  const switched = useRef(false)

  // The switch button unmounts with its screen, so move focus to the new heading (not on first render).
  useEffect(() => {
    if (switched.current) wrapper.current?.querySelector('h1')?.focus()
    switched.current = true
  }, [screen])

  return (
    <div ref={wrapper}>
      {screen === 'sign-in' ? (
        <SignInScreen origin={origin} onAuthenticated={onAuthenticated} onSwitch={() => setScreen('create-account')} />
      ) : (
        <CreateAccountScreen origin={origin} onAuthenticated={onAuthenticated} onSwitch={() => setScreen('sign-in')} />
      )}
    </div>
  )
}
