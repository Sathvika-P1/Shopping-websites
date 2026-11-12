import { describe, expect, it } from 'vitest';
import { validateLogin, validateRegistration } from '../src/auth/validation.js';

describe('validateRegistration', () => {
  it('accepts a valid email and password (AC 1)', () => {
    expect(validateRegistration({ email: 'a@b.com', password: 'plum2024' })).toEqual({});
  });
  it('rejects a 7 character password (AC 9)', () => {
    expect(validateRegistration({ email: 'a@b.com', password: 'abc1234' }).password).toBe('Use at least 8 characters.');
  });
  it('rejects a password without a number (AC 10)', () => {
    expect(validateRegistration({ email: 'a@b.com', password: 'abcdefgh' }).password).toBe(
      'Add at least one letter and one number.',
    );
  });
  it('rejects an empty email (AC 13)', () => {
    expect(validateRegistration({ email: '', password: 'plum2024' }).email).toBe('Enter your email address.');
  });
  it('rejects an email without @ (AC 14)', () => {
    expect(validateRegistration({ email: 'foo.example.com', password: 'plum2024' }).email).toMatch(/@/);
  });
  it('rejects an empty password', () => {
    expect(validateRegistration({ email: 'a@b.com', password: '' }).password).toBe('Create a password.');
  });
});

describe('validateLogin', () => {
  it('rejects an empty password (AC 15)', () => {
    expect(validateLogin({ email: 'a@b.com', password: '' }).password).toBe('Enter your password.');
  });
  it('rejects an empty email', () => {
    expect(validateLogin({ email: ' ', password: 'x' }).email).toBe('Enter your email address.');
  });
});
