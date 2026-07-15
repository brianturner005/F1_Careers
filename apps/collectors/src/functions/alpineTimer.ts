import { app, type InvocationContext, type Timer } from '@azure/functions';
import { alpineCollector } from '../sources/alpine/collector.js';
import { runCollector } from '../shared/runCollector.js';

// Once daily, offset 10 minutes from the other timers so they don't all fire at once.
const SCHEDULE = '0 10 6 * * *';

export async function alpineTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(alpineCollector, context);
}

app.timer('alpineTimer', {
  schedule: SCHEDULE,
  handler: alpineTimer,
});
