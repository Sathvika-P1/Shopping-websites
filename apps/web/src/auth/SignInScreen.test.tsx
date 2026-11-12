import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from './api'
import SignInScreen from './SignInScreen'

vi.mock('./api', () => ({ login: vi.fn(), register: vi.fn() }))

const noop = () => {}

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

describe('SignInScreen', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows one generic error for a failed sign-in (AC 4, 12)', async () => {
    vi.mocked(api.login).mockResolvedValue({ ok: false, kind: 'invalid_credentials' })
    render(<SignInScreen origin="other" onAuthenticated={noop} onSwitch={noop} />)
    fill('a@b.com', 'nope1234')
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password is not right. Try again.')
    expect(screen.getByLabelText('Email')).toHaveClass('is-invalid')
    expect(screen.getByLabelText('Password')).toHaveClass('is-invalid')
  })

  it('says something went wrong, not wrong credentials, when the request fails', async () => {
    vi.mocked(api.login).mockResolvedValue({ ok: false, kind: 'network' })
    render(<SignInScreen origin="other" onAuthenticated={noop} onSwitch={noop} />)
    fill('a@b.com', 'plum2024')
    submit()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong')
    expect(alert).not.toHaveTextContent('not right')
    expect(screen.getByLabelText('Password')).not.toHaveClass('is-invalid')
  })

  it.each([
    ['checkout', 'checkout'],
    ['other', 'account'],
  ] as const)('after sign-in from %s goes to %s (AC 2, 5, 6)', async (origin, dest) => {
    vi.mocked(api.login).mockResolvedValue({ ok: true, account: { id: '1', email: 'a@b.com' } })
    const fn = vi.fn()
    render(<SignInScreen origin={origin} onAuthenticated={fn} onSwitch={noop} />)
    fill('a@b.com', 'plum2024')
    submit()
    await waitFor(() => expect(fn).toHaveBeenCalledWith(dest))
  })

  it('shows an error next to an empty password and does not call the API (AC 15)', async () => {
    render(<SignInScreen origin="other" onAuthenticated={noop} onSwitch={noop} />)
    fill('a@b.com', '')
    submit()
    expect(await screen.findByText('Enter your password.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveClass('is-invalid')
    expect(api.login).not.toHaveBeenCalled()
  })

  it('notes the checkout destination when opened from checkout', () => {
    render(<SignInScreen origin="checkout" onAuthenticated={noop} onSwitch={noop} />)
    expect(screen.getByText('Sign in to continue to checkout.')).toBeInTheDocument()
  })
})
