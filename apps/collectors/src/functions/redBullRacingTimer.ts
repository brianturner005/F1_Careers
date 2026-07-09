import { app, type InvocationContext, type Timer } from '@azure/functions';
import { redBullRacingCollector } from '../sources/redBullRacing/collector.js';
import { runCollector } from '../shared/runCollector.js';

// Every 6 hours — within the brief's "2-4x/day per source is plenty" etiquette.
const SCHEDULE = '0 0 */6 * * *';

export async function redBullRacingTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(redBullRacingCollector, context);
}

app.timer('redBullRacingTimer', {
  schedule: SCHEDULE,
  handler: redBullRacingTimer,
});
