import { createHash, randomBytes } from 'node:crypto';
import type pg from 'pg';

const SESSION_DAYS = 30;

/** Stores a new session (only the token's sha256) and returns the raw token for the cookie. */
export async function createSession(
  pool: pg.Pool,
  accountId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await pool.query('INSERT INTO sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3)', [
    tokenHash,
    accountId,
    expiresAt,
  ]);
  return { token, expiresAt };
}

export function sessionCookie(token: string, expiresAt: Date): string {
  const parts = [`sid=${token}`, 'HttpOnly', 'SameSite=Lax', 'Path=/', `Expires=${expiresAt.toUTCString()}`];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}
