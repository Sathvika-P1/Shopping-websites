import { describe, it, expect } from 'vitest'
import * as web from './validation'
import * as api from '../../../../services/api/src/auth/validation'

const emails = ['', '  ', 'nope', 'a@b.co', ' A@B.CO ']
const passwords = ['', 'short1', 'abcdefgh', '12345678', 'abcdefg1', 'a1'.repeat(65)]

describe('web and API validation stay in step', () => {
  it.each(emails.flatMap((e) => passwords.map((p) => [e, p] as const)))('agrees for %j / %j', (email, password) => {
    expect(web.validateRegistration(email, password)).toEqual(api.validateRegistration({ email, password }))
    expect(web.validateLogin(email, password)).toEqual(api.validateLogin({ email, password }))
  })
})
