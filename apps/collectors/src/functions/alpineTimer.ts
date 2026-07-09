import { app, type InvocationContext, type Timer } from '@azure/functions';
import { alpineCollector } from '../sources/alpine/collector.js';
import { runCollector } from '../shared/runCollector.js';

const SCHEDULE = '0 10 */6 * * *';

export async function alpineTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(alpineCollector, context);
}

app.timer('alpineTimer', {
  schedule: SCHEDULE,
  handler: alpineTimer,
});
