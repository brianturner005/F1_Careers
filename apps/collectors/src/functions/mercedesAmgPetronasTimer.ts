import { app, type InvocationContext, type Timer } from '@azure/functions';
import { mercedesAmgPetronasCollector } from '../sources/mercedesAmgPetronas/collector.js';
import { runCollector } from '../shared/runCollector.js';

// Every 6 hours, offset 5 minutes from the other timers so they don't all fire at once.
const SCHEDULE = '0 5 */6 * * *';

export async function mercedesAmgPetronasTimer(
  _timer: Timer,
  context: InvocationContext,
): Promise<void> {
  await runCollector(mercedesAmgPetronasCollector, context);
}

app.timer('mercedesAmgPetronasTimer', {
  schedule: SCHEDULE,
  handler: mercedesAmgPetronasTimer,
});
