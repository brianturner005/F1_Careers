import type { CollectorConfig } from '../../shared/collector.js';
import type { PinpointCollectorOptions } from '../../pinpoint/client.js';

export const astonMartinConfig: CollectorConfig = {
  id: 'pinpoint-aston-martin',
  company: 'Aston Martin Aramco Formula One Team',
  atsPlatform: 'Pinpoint',
};

export const astonMartinPinpointOptions: PinpointCollectorOptions = {
  subdomain: 'astonmartinf1',
};
