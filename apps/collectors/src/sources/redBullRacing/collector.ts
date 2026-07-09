import type { Collector } from '../../shared/collector.js';
import { fetchWorkdayPostings } from '../../workday/client.js';
import { redBullRacingConfig, redBullRacingWorkdayOptions } from './config.js';

export const redBullRacingCollector: Collector = {
  config: redBullRacingConfig,
  fetch: () => fetchWorkdayPostings(redBullRacingWorkdayOptions),
};
