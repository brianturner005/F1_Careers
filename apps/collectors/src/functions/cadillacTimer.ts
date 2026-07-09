import { app, type InvocationContext, type Timer } from '@azure/functions';
import { cadillacCollector } from '../sources/cadillac/collector.js';
import { runCollector } from '../shared/runCollector.js';

const SCHEDULE = '0 20 */6 * * *';

export async function cadillacTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(cadillacCollector, context);
}

app.timer('cadillacTimer', {
  schedule: SCHEDULE,
  handler: cadillacTimer,
});
