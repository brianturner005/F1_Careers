import type { Collector } from '../../shared/collector.js';
import { fetchWorkdayPostings } from '../../workday/client.js';
import { formula1ManagementConfig, formula1ManagementWorkdayOptions } from './config.js';

export const formula1ManagementCollector: Collector = {
  config: formula1ManagementConfig,
  fetch: () => fetchWorkdayPostings(formula1ManagementWorkdayOptions),
};
