import type { Collector } from '../../shared/collector.js';
import { fetchTrakstarPostings } from '../../trakstar/client.js';
import { pirelliConfig, pirelliTrakstarOptions } from './config.js';

export const pirelliCollector: Collector = {
  config: pirelliConfig,
  fetch: () => fetchTrakstarPostings(pirelliTrakstarOptions),
};
