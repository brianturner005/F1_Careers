import type { Collector } from '../../shared/collector.js';
import { fetchWorkableJobs } from '../../workable/client.js';
import { cadillacConfig, cadillacWorkableOptions } from './config.js';

export const cadillacCollector: Collector = {
  config: cadillacConfig,
  fetch: () => fetchWorkableJobs(cadillacWorkableOptions),
};
