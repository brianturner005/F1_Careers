import type { Source } from '@f1-job-radar/schema';
import { getContainer } from './cosmosClient.js';

function toSource(doc: Source): Source {
  return {
    id: doc.id,
    displayName: doc.displayName,
    company: doc.company,
    atsPlatform: doc.atsPlatform,
    status: doc.status,
    lastRunAt: doc.lastRunAt,
  };
}

// Backs the collector-health admin view (brief §8, principle 2).
export async function listSources(): Promise<Source[]> {
  const container = getContainer('sources');
  const { resources } = await container.items
    .query<Source>('SELECT * FROM c ORDER BY c.displayName')
    .fetchAll();
  return resources.map(toSource);
}
