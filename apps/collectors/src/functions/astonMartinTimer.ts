import { app, type InvocationContext, type Timer } from '@azure/functions';
import { astonMartinCollector } from '../sources/astonMartin/collector.js';
import { runCollector } from '../shared/runCollector.js';

const SCHEDULE = '0 15 */6 * * *';

export async function astonMartinTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  await runCollector(astonMartinCollector, context);
}

app.timer('astonMartinTimer', {
  schedule: SCHEDULE,
  handler: astonMartinTimer,
});
