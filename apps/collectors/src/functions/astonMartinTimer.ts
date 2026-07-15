import { app, type InvocationContext, type Timer } from '@azure/functions';
import { astonMartinCollector } from '../sources/astonMartin/collector.js';
import { runCollector } from '../shared/runCollector.js';

// Once daily, offset 15 minutes from the other timers so they don't all fire at once.
const SCHEDULE = '0 15 6 * * *';

export async function astonMartinTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(astonMartinCollector, context);
}

app.timer('astonMartinTimer', {
  schedule: SCHEDULE,
  handler: astonMartinTimer,
});
