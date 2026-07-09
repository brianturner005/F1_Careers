import type { Collector } from '../../shared/collector.js';
import { fetchWorkdayPostings } from '../../workday/client.js';
import { alpineConfig, alpineWorkdayOptions } from './config.js';

export const alpineCollector: Collector = {
  config: alpineConfig,
  fetch: () => fetchWorkdayPostings(alpineWorkdayOptions),
};
