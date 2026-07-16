import { randomUUID } from 'node:crypto';
import type { CollectorRun } from '@f1-job-radar/schema';
import { getContainer } from './cosmosClient.js';

// Records a run in the audit log and updates the parent source's health
// summary — this pair is what the collector-health dashboard (brief §8,
// principle 2) reads from. The source document must already exist (sources
// are seeded via scripts/seed-cosmos.mjs before the first collector run) --
// patch fails otherwise, same requirement the old SQL foreign key enforced.
export async function recordCollectorRun(run: CollectorRun): Promise<void> {
  const runsContainer = getContainer('collectorRuns');
  await runsContainer.items.create({ id: randomUUID(), ...run });

  const sourcesContainer = getContainer('sources');
  await sourcesContainer.item(run.source, run.source).patch([
    { op: 'replace', path: '/lastRunAt', value: run.finishedAt },
    { op: 'replace', path: '/status', value: run.error ? 'failing' : 'healthy' },
  ]);
}
