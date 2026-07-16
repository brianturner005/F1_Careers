import { getContainer, isCosmosNotFound } from './cosmosClient.js';
import { generateToken, hashToken } from './tokens.js';

const TOKEN_TTL_MS = 15 * 60 * 1000;

interface MagicLinkTokenDoc {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

export async function createMagicLinkToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();

  const container = getContainer('magicLinkTokens');
  const doc: MagicLinkTokenDoc & { id: string } = {
    id: tokenHash,
    tokenHash,
    userId,
    expiresAt,
    consumedAt: null,
    createdAt: now.toISOString(),
  };
  await container.items.create(doc);

  return token;
}

// One-shot: returns the associated userId if the token exists, is unexpired,
// and hasn't already been consumed; null otherwise. Marks it consumed.
export async function consumeMagicLinkToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const container = getContainer('magicLinkTokens');

  let doc: MagicLinkTokenDoc | undefined;
  try {
    ({ resource: doc } = await container.item(tokenHash, tokenHash).read<MagicLinkTokenDoc>());
  } catch (err) {
    if (isCosmosNotFound(err)) return null;
    throw err;
  }

  if (!doc || doc.consumedAt || new Date(doc.expiresAt).getTime() < Date.now()) {
    return null;
  }

  await container
    .item(tokenHash, tokenHash)
    .patch([{ op: 'replace', path: '/consumedAt', value: new Date().toISOString() }]);

  return doc.userId;
}
