import { app, type InvocationContext, type Timer } from '@azure/functions';
import { runDigest } from '../shared/runDigest.js';

// Once a week, Monday 07:15 UTC (offset from the daily run so they don't
// both hit the DB at the exact same second).
const SCHEDULE = '0 15 7 * * 1';

export async function weeklyDigestTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runDigest('weekly', context);
}

app.timer('weeklyDigestTimer', {
  schedule: SCHEDULE,
  handler: weeklyDigestTimer,
});
