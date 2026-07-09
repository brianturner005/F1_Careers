import { randomUUID } from 'node:crypto';
import sql from 'mssql';
import type { User } from '@f1-job-radar/schema';
import { rowToUser, type UserRow } from './accountsRowMapping.js';
import { getPool } from './pool.js';

const UNIQUE_CONSTRAINT_VIOLATION = 2627;

export async function findUserByEmail(email: string): Promise<User | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar, email)
    .query<UserRow>('SELECT * FROM users WHERE email = @email');
  const row = result.recordset[0];
  return row ? rowToUser(row) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.NVarChar, id)
    .query<UserRow>('SELECT * FROM users WHERE id = @id');
  const row = result.recordset[0];
  return row ? rowToUser(row) : null;
}

// Passwordless auth has no separate sign-up step — the first magic-link
// request for an email creates the account.
export async function findOrCreateUserByEmail(email: string): Promise<User> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const id = randomUUID();
  const createdAt = new Date();
  const pool = await getPool();

  try {
    await pool
      .request()
      .input('id', sql.NVarChar, id)
      .input('email', sql.NVarChar, email)
      .input('createdAt', sql.DateTime2, createdAt)
      .query('INSERT INTO users (id, email, created_at) VALUES (@id, @email, @createdAt)');
  } catch (err) {
    // Two concurrent first-time requests for the same email can both reach
    // here; the loser just re-reads the winner's row.
    const isDuplicateEmail =
      typeof err === 'object' &&
      err !== null &&
      'number' in err &&
      (err as { number: unknown }).number === UNIQUE_CONSTRAINT_VIOLATION;
    if (!isDuplicateEmail) throw err;
    const winner = await findUserByEmail(email);
    if (winner) return winner;
    throw err;
  }

  return { id, email, createdAt: createdAt.toISOString() };
}
