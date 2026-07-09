import sql from 'mssql';
import { getPool } from './pool.js';
import { generateToken, hashToken } from './tokens.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const pool = await getPool();
  await pool
    .request()
    .input('tokenHash', sql.NVarChar, hashToken(token))
    .input('userId', sql.NVarChar, userId)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .input('createdAt', sql.DateTime2, now).query(`
      INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
      VALUES (@tokenHash, @userId, @expiresAt, @createdAt)
    `);

  return token;
}

export async function getUserIdForSession(token: string): Promise<string | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('tokenHash', sql.NVarChar, hashToken(token))
    .query<{ user_id: string; expires_at: Date }>(
      'SELECT user_id, expires_at FROM sessions WHERE token_hash = @tokenHash',
    );

  const row = result.recordset[0];
  if (!row || row.expires_at.getTime() < Date.now()) return null;
  return row.user_id;
}

export async function deleteSession(token: string): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('tokenHash', sql.NVarChar, hashToken(token))
    .query('DELETE FROM sessions WHERE token_hash = @tokenHash');
}
