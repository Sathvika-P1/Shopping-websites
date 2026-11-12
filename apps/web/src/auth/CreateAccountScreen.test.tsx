import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from './api'
import CreateAccountScreen from './CreateAccountScreen'

vi.mock('./api', () => ({ login: vi.fn(), register: vi.fn() }))

const noop = () => {}

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

describe('CreateAccountScreen', () => {
  beforeEach(() => vi.resetAllMocks())

  it('has no name field (AC 11)', () => {
    render(<CreateAccountScreen origin="other" onAuthenticated={noop} onSwitch={noop} />)
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it.each([
    ['7 characters (AC 9)', 'abc1234', 'Use at least 8 characters.'],
    ['no number (AC 10)', 'abcdefgh', 'Add at least one letter and one number.'],
  ])('shows a password error and does not register: %s', async (_n, password, message) => {
    render(<CreateAccountScreen origin="other" onAuthenticated={noop} onSwitch={noop} />)
    fill('a@b.com', password)
    submit()
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
    expect(api.register).not.toHaveBeenCalled()
  })

  it.each([
    ['empty (AC 13)', ''],
    ['without @ (AC 14)', 'no-at-sign.example.com'],
  ])('shows an email error and does not register: %s', async (_n, email) => {
    render(<CreateAccountScreen origin="other" onAuthenticated={noop} onSwitch={noop} />)
    fill(email, 'plum2024')
    submit()
    const field = screen.getByLabelText('Email').closest('.field') as HTMLElement
    await waitFor(() => expect(within(field).getByRole('alert')).toBeInTheDocument())
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(api.register).not.toHaveBeenCalled()
  })

  it.each([
    ['checkout', 'checkout'],
    ['other', 'account'],
  ] as const)('after creating from %s goes to %s (AC 1, 16, 17, 18)', async (origin, dest) => {
    vi.mocked(api.register).mockResolvedValue({ ok: true, account: { id: '1', email: 'a@b.com' } })
    const fn = vi.fn()
    render(<CreateAccountScreen origin={origin} onAuthenticated={fn} onSwitch={noop} />)
    if (origin === 'checkout') {
      expect(screen.getByText('Create an account to continue to checkout.')).toBeInTheDocument()
    }
    fill('a@b.com', 'plum2024')
    submit()
    await waitFor(() => expect(fn).toHaveBeenCalledWith(dest))
  })

  it('shows the taken-email error inside the email field and keeps typed values (AC 3)', async () => {
    vi.mocked(api.register).mockResolvedValue({
      ok: false,
      kind: 'field',
      errors: { email: 'An account with this email already exists.' },
    })
    render(<CreateAccountScreen origin="other" onAuthenticated={noop} onSwitch={noop} />)
    fill('maya@example.com', 'plum2024x')
    submit()
    const field = screen.getByLabelText('Email').closest('.field') as HTMLElement
    expect(await within(field).findByText(/An account with this email already exists\./)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('maya@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('plum2024x')
  })
})
