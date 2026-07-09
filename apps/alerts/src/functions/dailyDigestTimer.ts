import { app, type InvocationContext, type Timer } from '@azure/functions';
import { runDigest } from '../shared/runDigest.js';

// Once a day, 07:00 UTC.
const SCHEDULE = '0 0 7 * * *';

export async function dailyDigestTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runDigest('daily', context);
}

app.timer('dailyDigestTimer', {
  schedule: SCHEDULE,
  handler: dailyDigestTimer,
});
