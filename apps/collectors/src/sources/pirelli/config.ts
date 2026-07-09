import type { CollectorConfig } from '../../shared/collector.js';
import type { TrakstarCollectorOptions } from '../../trakstar/client.js';

export const pirelliConfig: CollectorConfig = {
  id: 'trakstar-pirelli',
  company: 'Pirelli',
  atsPlatform: 'Trakstar',
};

export const pirelliTrakstarOptions: TrakstarCollectorOptions = {
  subdomain: 'pirelli',
  companyName: 'Pirelli',
};
