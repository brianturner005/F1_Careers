import type { Collector } from '../../shared/collector.js';
import { fetchPinpointPostings } from '../../pinpoint/client.js';
import { astonMartinConfig, astonMartinPinpointOptions } from './config.js';

export const astonMartinCollector: Collector = {
  config: astonMartinConfig,
  fetch: () => fetchPinpointPostings(astonMartinPinpointOptions),
};
