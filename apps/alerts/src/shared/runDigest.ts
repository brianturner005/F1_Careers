import {
  getUserById,
  listOpenJobs,
  listSavedSearchesByFrequency,
  markSavedSearchAlerted,
  recordAlert,
} from '@f1-job-radar/db';
import { createEmailSender, digestEmail } from '@f1-job-radar/email';
import type { AlertFrequency } from '@f1-job-radar/schema';
import { selectDueSearches } from './dueSearches.js';

export interface DigestLogger {
  log(message: string): void;
  error(message: string): void;
}

const MAX_JOBS_PER_DIGEST = 50;

export async function runDigest(
  frequency: AlertFrequency,
  logger: DigestLogger,
  now: Date = new Date(),
): Promise<void> {
  const candidates = await listSavedSearchesByFrequency(frequency);
  const due = selectDueSearches(candidates, frequency, now);
  const sender = createEmailSender();

  for (const search of due) {
    const sentAt = now.toISOString();
    try {
      const since = search.lastAlertedAt ?? search.createdAt;
      const { jobs } = await listOpenJobs({
        ...search.filters,
        firstSeenAfter: since,
        limit: MAX_JOBS_PER_DIGEST,
        offset: 0,
      });

      if (jobs.length > 0) {
        const user = await getUserById(search.userId);
        if (user) {
          await sender.send({ to: user.email, ...digestEmail(search, jobs) });
        }
      }

      await markSavedSearchAlerted(search.id, sentAt);
      await recordAlert({ savedSearchId: search.id, sentAt, jobCount: jobs.length, error: null });
      logger.log(`[alerts:${frequency}] ${search.id} matched=${jobs.length}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[alerts:${frequency}] ${search.id} failed: ${message}`);
      await recordAlert({ savedSearchId: search.id, sentAt, jobCount: 0, error: message }).catch(
        (logErr: unknown) =>
          logger.error(`[alerts:${frequency}] failed to record alert_log: ${String(logErr)}`),
      );
    }
  }
}
