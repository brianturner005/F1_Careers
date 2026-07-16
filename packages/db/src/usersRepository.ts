import { randomUUID } from 'node:crypto';
import type { User } from '@f1-job-radar/schema';
import { getContainer, isCosmosConflict, isCosmosNotFound } from './cosmosClient.js';

function toUser(doc: User): User {
  return { id: doc.id, email: doc.email, createdAt: doc.createdAt };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const container = getContainer('users');
  const { resources } = await container.items
    .query<User>({
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email }],
    })
    .fetchAll();
  return resources[0] ? toUser(resources[0]) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const container = getContainer('users');
  try {
    const { resource } = await container.item(id, id).read<User>();
    return resource ? toUser(resource) : null;
  } catch (err) {
    if (isCosmosNotFound(err)) return null;
    throw err;
  }
}

// Passwordless auth has no separate sign-up step — the first magic-link
// request for an email creates the account. The `users` container has a
// unique-key policy on /email (see infra/modules/cosmos.bicep), so a
// duplicate create() throws a 409 rather than silently succeeding.
export async function findOrCreateUserByEmail(email: string): Promise<User> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const container = getContainer('users');

  try {
    await container.items.create({ id, email, createdAt });
  } catch (err) {
    // Two concurrent first-time requests for the same email can both reach
    // here; the loser just re-reads the winner's row.
    if (!isCosmosConflict(err)) throw err;
    const winner = await findUserByEmail(email);
    if (winner) return winner;
    throw err;
  }

  return { id, email, createdAt };
}
