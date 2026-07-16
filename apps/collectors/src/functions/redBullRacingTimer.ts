import { app, type InvocationContext, type Timer } from '@azure/functions';
import { redBullRacingCollector } from '../sources/redBullRacing/collector.js';
import { runCollector } from '../shared/runCollector.js';

// Once daily — job postings don't turn over fast enough to need more, and
// it's gentler on the source's servers than polling every few hours.
const SCHEDULE = '0 0 6 * * *';

export async function redBullRacingTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(redBullRacingCollector, context);
}

app.timer('redBullRacingTimer', {
  schedule: SCHEDULE,
  handler: redBullRacingTimer,
});
