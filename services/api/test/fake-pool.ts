import type pg from 'pg';

export type Store = {
  accounts: { id: string; email: string; password_hash: string }[];
  sessions: { token_hash: string; account_id: string; expires_at: Date }[];
};

/** In-memory stand-in for the pg pool, understanding only the queries the auth routes run. */
export function fakePool(): { pool: pg.Pool; store: Store } {
  const store: Store = { accounts: [], sessions: [] };
  const query = async (text: string, params: unknown[] = []) => {
    if (/^\s*INSERT INTO accounts/i.test(text)) {
      const [email, password_hash] = params as string[];
      if (store.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        throw Object.assign(new Error('duplicate key'), { code: '23505' });
      }
      const row = { id: `acc-${store.accounts.length + 1}`, email, password_hash };
      store.accounts.push(row);
      return { rows: [{ id: row.id, email: row.email }] };
    }
    if (/^\s*SELECT .* FROM accounts/i.test(text)) {
      const email = String(params[0]).toLowerCase();
      return { rows: store.accounts.filter((a) => a.email.toLowerCase() === email) };
    }
    if (/^\s*INSERT INTO sessions/i.test(text)) {
      const [token_hash, account_id, expires_at] = params as [string, string, Date];
      store.sessions.push({ token_hash, account_id, expires_at });
      return { rows: [] };
    }
    throw new Error(`unexpected query: ${text}`);
  };
  return { pool: { query } as unknown as pg.Pool, store };
}
