import { randomUUID } from 'node:crypto';
import { getContainer } from './cosmosClient.js';

export interface RecordAlertInput {
  savedSearchId: string;
  sentAt: string;
  jobCount: number;
  error: string | null;
}

export async function recordAlert(input: RecordAlertInput): Promise<void> {
  const container = getContainer('alertLog');
  await container.items.create({ id: randomUUID(), ...input });
}
