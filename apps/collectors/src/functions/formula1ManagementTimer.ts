import { app, type InvocationContext, type Timer } from '@azure/functions';
import { formula1ManagementCollector } from '../sources/formula1Management/collector.js';
import { runCollector } from '../shared/runCollector.js';

const SCHEDULE = '0 25 */6 * * *';

export async function formula1ManagementTimer(
  _timer: Timer,
  context: InvocationContext,
): Promise<void> {
  await runCollector(formula1ManagementCollector, context);
}

app.timer('formula1ManagementTimer', {
  schedule: SCHEDULE,
  handler: formula1ManagementTimer,
});
