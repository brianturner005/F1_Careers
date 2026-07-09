import sql from 'mssql';
import { getPool } from './pool.js';
import { generateToken, hashToken } from './tokens.js';

const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function createMagicLinkToken(userId: string): Promise<string> {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS);

  const pool = await getPool();
  await pool
    .request()
    .input('tokenHash', sql.NVarChar, hashToken(token))
    .input('userId', sql.NVarChar, userId)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .input('createdAt', sql.DateTime2, now).query(`
      INSERT INTO magic_link_tokens (token_hash, user_id, expires_at, created_at)
      VALUES (@tokenHash, @userId, @expiresAt, @createdAt)
    `);

  return token;
}

// One-shot: returns the associated userId if the token exists, is unexpired,
// and hasn't already been consumed; null otherwise. Marks it consumed.
export async function consumeMagicLinkToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const pool = await getPool();

  const result = await pool
    .request()
    .input('tokenHash', sql.NVarChar, tokenHash)
    .query<{ user_id: string; expires_at: Date; consumed_at: Date | null }>(
      'SELECT user_id, expires_at, consumed_at FROM magic_link_tokens WHERE token_hash = @tokenHash',
    );

  const row = result.recordset[0];
  if (!row || row.consumed_at || row.expires_at.getTime() < Date.now()) {
    return null;
  }

  await pool
    .request()
    .input('tokenHash', sql.NVarChar, tokenHash)
    .input('consumedAt', sql.DateTime2, new Date())
    .query('UPDATE magic_link_tokens SET consumed_at = @consumedAt WHERE token_hash = @tokenHash');

  return row.user_id;
}
