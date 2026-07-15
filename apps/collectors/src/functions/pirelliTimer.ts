import { app, type InvocationContext, type Timer } from '@azure/functions';
import { pirelliCollector } from '../sources/pirelli/collector.js';
import { runCollector } from '../shared/runCollector.js';

// Once daily, offset 30 minutes from the other timers so they don't all fire at once.
const SCHEDULE = '0 30 6 * * *';

export async function pirelliTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(pirelliCollector, context);
}

app.timer('pirelliTimer', {
  schedule: SCHEDULE,
  handler: pirelliTimer,
});
