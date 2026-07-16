import { getContainer, isCosmosNotFound } from './cosmosClient.js';
import { generateToken, hashToken } from './tokens.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionDoc {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  const container = getContainer('sessions');
  const doc: SessionDoc & { id: string } = {
    id: tokenHash,
    tokenHash,
    userId,
    expiresAt,
    createdAt: now.toISOString(),
  };
  await container.items.create(doc);

  return token;
}

export async function getUserIdForSession(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const container = getContainer('sessions');

  try {
    const { resource } = await container.item(tokenHash, tokenHash).read<SessionDoc>();
    if (!resource || new Date(resource.expiresAt).getTime() < Date.now()) return null;
    return resource.userId;
  } catch (err) {
    if (isCosmosNotFound(err)) return null;
    throw err;
  }
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const container = getContainer('sessions');
  try {
    await container.item(tokenHash, tokenHash).delete();
  } catch (err) {
    if (!isCosmosNotFound(err)) throw err;
  }
}
