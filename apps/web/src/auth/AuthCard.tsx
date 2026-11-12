import type { FormEvent, ReactNode } from 'react'

export type Origin = 'checkout' | 'other'
export type Destination = 'checkout' | 'account'
export type ScreenProps = {
  origin: Origin
  onAuthenticated: (dest: Destination) => void
  onSwitch: () => void
}

type Props = {
  title: string
  note?: string
  banner?: ReactNode
  submitLabel: string
  pending: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  switchPrompt: string
  switchLabel: string
  onSwitch: () => void
  children: ReactNode
}

export default function AuthCard(props: Props) {
  return (
    <div className="card auth-card stack">
      <h1 tabIndex={-1}>{props.title}</h1>
      {props.note && <p className="auth-note">{props.note}</p>}
      {props.banner}
      <form className="stack" noValidate onSubmit={props.onSubmit}>
        {props.children}
        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={props.pending}>
          {props.submitLabel}
        </button>
      </form>
      <p className="auth-switch">
        {props.switchPrompt}{' '}
        <button className="link-btn" type="button" onClick={props.onSwitch}>
          {props.switchLabel}
        </button>
      </p>
    </div>
  )
}
