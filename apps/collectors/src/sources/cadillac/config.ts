import type { CollectorConfig } from '../../shared/collector.js';
import type { WorkableCollectorOptions } from '../../workable/client.js';

export const cadillacConfig: CollectorConfig = {
  id: 'workable-cadillac',
  company: 'Cadillac Formula 1 Team',
  atsPlatform: 'Workable',
};

export const cadillacWorkableOptions: WorkableCollectorOptions = {
  account: 'cadillacf1team',
};
