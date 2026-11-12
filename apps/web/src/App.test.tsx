import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

vi.mock('./auth/api', () => ({ login: vi.fn(), register: vi.fn() }))

describe('App', () => {
  it('renders the Sign in screen first', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
