import {
  getOpenJobsBySource,
  recordCollectorRun,
  upsertJobs,
  withDbConnection,
} from '@f1-job-radar/db';
import type { Collector } from './collector.js';
import { dedupeById } from './dedupe.js';
import { diffPostings } from './diff.js';
import { normalizePostings } from './normalize.js';

export interface RunLogger {
  log(message: string): void;
  error(message: string): void;
}

// Shared fetch -> normalize -> diff -> persist pipeline every timer-triggered
// collector function calls. One place to get diffing/logging/error-recording
// right so each source's Azure Function body stays a one-liner.
export async function runCollector(collector: Collector, logger: RunLogger): Promise<void> {
  return withDbConnection(() => runCollectorInternal(collector, logger));
}

async function runCollectorInternal(collector: Collector, logger: RunLogger): Promise<void> {
  const startedAt = new Date().toISOString();

  try {
    const raw = await collector.fetch();
    const now = new Date().toISOString();
    const fresh = dedupeById(normalizePostings(raw, collector.config, now));

    const previouslyOpen = await getOpenJobsBySource(collector.config.id);
    const { newJobs, updatedJobs, unchangedJobs, closedJobs } = diffPostings(previouslyOpen, fresh);

    await upsertJobs([...newJobs, ...updatedJobs, ...unchangedJobs, ...closedJobs]);

    const finishedAt = new Date().toISOString();
    await recordCollectorRun({
      source: collector.config.id,
      startedAt,
      finishedAt,
      postingsFound: fresh.length,
      postingsNew: newJobs.length,
      postingsClosed: closedJobs.length,
      error: null,
    });

    logger.log(
      `[${collector.config.id}] found=${fresh.length} new=${newJobs.length} updated=${updatedJobs.length} closed=${closedJobs.length}`,
    );
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const message = err instanceof Error ? err.message : String(err);

    await recordCollectorRun({
      source: collector.config.id,
      startedAt,
      finishedAt,
      postingsFound: 0,
      postingsNew: 0,
      postingsClosed: 0,
      error: message,
    });

    logger.error(`[${collector.config.id}] collector run failed: ${message}`);
    throw err;
  }
}
