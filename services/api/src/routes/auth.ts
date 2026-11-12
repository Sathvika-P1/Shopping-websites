import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { createSession, sessionCookie } from '../auth/sessions.js';
import { normalizeEmail, validateLogin, validateRegistration } from '../auth/validation.js';
import { getPool } from '../db.js';

const INVALID_CREDENTIALS = {
  error: 'invalid_credentials',
  message: 'The email or password is not right. Try again.',
};
// Checked when the email is unknown so both failures cost the same time.
const dummyHash = hashPassword('not-a-real-password');

type Body = { email?: unknown; password?: unknown };

export async function authRoutes(app: FastifyInstance, opts: { pool?: pg.Pool } = {}): Promise<void> {
  const pool = opts.pool ?? getPool();

  app.post('/register', async (request, reply) => {
    const body = (request.body ?? {}) as Body;
    const errors = validateRegistration(body);
    if (Object.keys(errors).length > 0) return reply.code(422).send({ errors });

    const email = normalizeEmail(body.email);
    const passwordHash = await hashPassword(body.password as string);
    let account: { id: string; email: string };
    try {
      const res = await pool.query('INSERT INTO accounts (email, password_hash) VALUES ($1, $2) RETURNING id, email', [
        email,
        passwordHash,
      ]);
      account = res.rows[0];
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return reply.code(409).send({ errors: { email: 'An account with this email already exists.' } });
      }
      throw err;
    }
    const { token, expiresAt } = await createSession(pool, account.id);
    return reply
      .code(201)
      .header('Set-Cookie', sessionCookie(token, expiresAt))
      .send({ account: { id: account.id, email: account.email } });
  });

  app.post('/login', async (request, reply) => {
    const body = (request.body ?? {}) as Body;
    const errors = validateLogin(body);
    if (Object.keys(errors).length > 0) return reply.code(422).send({ errors });

    const res = await pool.query('SELECT id, email, password_hash FROM accounts WHERE lower(email) = $1', [
      normalizeEmail(body.email),
    ]);
    const account = res.rows[0] as { id: string; email: string; password_hash: string } | undefined;
    const ok = await verifyPassword(body.password as string, account?.password_hash ?? (await dummyHash));
    if (!account || !ok) return reply.code(401).send(INVALID_CREDENTIALS);

    const { token, expiresAt } = await createSession(pool, account.id);
    return reply
      .header('Set-Cookie', sessionCookie(token, expiresAt))
      .send({ account: { id: account.id, email: account.email } });
  });
}
