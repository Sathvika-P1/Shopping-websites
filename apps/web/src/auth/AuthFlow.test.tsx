import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import AuthFlow from './AuthFlow'

vi.mock('./api', () => ({ login: vi.fn(), register: vi.fn() }))

describe('AuthFlow', () => {
  it('moves between Sign in and Create account (AC 7, 8)', () => {
    render(<AuthFlow origin="other" onAuthenticated={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(screen.getByRole('heading', { name: 'Create account' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toHaveFocus()
  })

  it('does not steal focus on first render, even under StrictMode', () => {
    render(
      <StrictMode>
        <AuthFlow origin="other" onAuthenticated={() => {}} />
      </StrictMode>,
    )
    expect(screen.getByRole('heading', { name: 'Sign in' })).not.toHaveFocus()
  })
})
