import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { hashPassword } from '../src/auth/password.js';
import { fakePool } from './fake-pool.js';

async function setup() {
  const { pool, store } = fakePool();
  store.accounts.push({ id: 'acc-1', email: 'maya@example.com', password_hash: await hashPassword('plum2024') });
  return { app: buildApp({ pool }), store };
}
const login = (app: ReturnType<typeof buildApp>, payload: object) =>
  app.inject({ method: 'POST', url: '/api/auth/login', payload });

describe('POST /api/auth/login', () => {
  it('signs in with correct credentials (AC 2)', async () => {
    const { app, store } = await setup();
    const res = await login(app, { email: 'Maya@example.com', password: 'plum2024' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toMatch(/^sid=/);
    expect(res.json().account).toEqual({ id: 'acc-1', email: 'maya@example.com' });
    expect(store.sessions).toHaveLength(1);
  });

  it('gives identical generic errors for wrong password and unknown email (AC 4, 12)', async () => {
    const { app } = await setup();
    const wrongPw = await login(app, { email: 'maya@example.com', password: 'nope1234' });
    const unknown = await login(app, { email: 'nobody@example.com', password: 'nope1234' });
    expect(wrongPw.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(unknown.json()).toEqual(wrongPw.json());
    expect(JSON.stringify(wrongPw.json())).not.toMatch(/email is|password is (wrong|incorrect)|no account/i);
    expect(wrongPw.headers['set-cookie']).toBeUndefined();
  });

  it('returns 422 for an empty password and does not sign in (AC 15)', async () => {
    const { app, store } = await setup();
    const res = await login(app, { email: 'maya@example.com', password: '' });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors.password).toBe('Enter your password.');
    expect(store.sessions).toHaveLength(0);
  });

  it('answers a password over 128 characters with the generic error', async () => {
    const { app, store } = await setup();
    const res = await login(app, { email: 'maya@example.com', password: 'x'.repeat(129) });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('invalid_credentials');
    expect(store.sessions).toHaveLength(0);
  });
});
