import { createHash, randomBytes } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Only the hash is ever stored — see migrations/0003_accounts_and_alerts.sql.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
