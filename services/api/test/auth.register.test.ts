import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { fakePool } from './fake-pool.js';

function setup() {
  const { pool, store } = fakePool();
  return { app: buildApp({ pool }), store };
}
const register = (app: ReturnType<typeof buildApp>, payload: object) =>
  app.inject({ method: 'POST', url: '/api/auth/register', payload });

describe('POST /api/auth/register', () => {
  it('creates the account and signs the shopper in (AC 1, 16)', async () => {
    const { app, store } = setup();
    const res = await register(app, { email: 'new@example.com', password: 'plum2024' });
    expect(res.statusCode).toBe(201);
    expect(res.json().account.email).toBe('new@example.com');
    expect(res.headers['set-cookie']).toMatch(/^sid=.+HttpOnly/);
    expect(store.accounts).toHaveLength(1);
    expect(store.accounts[0].password_hash).not.toContain('plum2024');
    expect(store.sessions).toHaveLength(1);
    expect(JSON.stringify(res.json())).not.toContain('password_hash');
  });

  it('rejects an already registered email, any case (AC 3)', async () => {
    const { app, store } = setup();
    await register(app, { email: 'new@example.com', password: 'plum2024' });
    const res = await register(app, { email: 'New@Example.com', password: 'plum2024' });
    expect(res.statusCode).toBe(409);
    expect(res.json().errors.email).toMatch(/already exists/);
    expect(store.accounts).toHaveLength(1);
  });

  it.each([
    ['short password (AC 9)', { email: 'a@b.com', password: 'abc1234' }, 'password'],
    ['no number (AC 10)', { email: 'a@b.com', password: 'abcdefgh' }, 'password'],
    ['empty email (AC 13)', { email: '', password: 'plum2024' }, 'email'],
    ['no @ (AC 14)', { email: 'a.example.com', password: 'plum2024' }, 'email'],
  ])('returns 422 and creates nothing: %s', async (_n, payload, field) => {
    const { app, store } = setup();
    const res = await register(app, payload);
    expect(res.statusCode).toBe(422);
    expect(res.json().errors[field]).toBeTruthy();
    expect(store.accounts).toHaveLength(0);
  });

  it('rejects a password over 128 characters without creating an account', async () => {
    const { app, store } = setup();
    const res = await register(app, { email: 'a@b.com', password: `a1${'x'.repeat(127)}` });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors.password).toMatch(/128/);
    expect(store.accounts).toHaveLength(0);
  });
});
