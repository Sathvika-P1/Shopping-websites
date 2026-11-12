import { readFileSync } from 'node:fs';
import type pg from 'pg';
import { describe, expect, it } from 'vitest';
import { runMigrations } from '../src/migrate.js';

describe('runMigrations', () => {
  it('applies each file once, even when run twice', async () => {
    const applied = new Set<string>();
    const executed: string[] = [];
    const client = {
      query: async (text: string, params?: string[]) => {
        if (/SELECT name FROM schema_migrations/i.test(text)) {
          return { rows: [...applied].map((name) => ({ name })) };
        }
        if (/INSERT INTO schema_migrations/i.test(text)) applied.add(params![0]);
        else executed.push(text);
        return { rows: [] };
      },
      release: () => {},
    };
    const pool = { connect: async () => client } as unknown as pg.Pool;
    await runMigrations(pool);
    await runMigrations(pool);
    expect(executed.filter((t) => /CREATE TABLE accounts/.test(t))).toHaveLength(1);
  });

  it('guards email uniqueness case-insensitively (AC 3)', () => {
    const sql = readFileSync(new URL('../migrations/001_accounts_and_sessions.sql', import.meta.url), 'utf8');
    expect(sql).toMatch(/CREATE UNIQUE INDEX accounts_email_lower_key ON accounts \(lower\(email\)\)/);
  });
});
