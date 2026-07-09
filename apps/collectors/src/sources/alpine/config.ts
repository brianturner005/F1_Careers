import type { CollectorConfig } from '../../shared/collector.js';
import type { WorkdayCollectorOptions } from '../../workday/client.js';

export const alpineConfig: CollectorConfig = {
  id: 'workday-alpine',
  company: 'BWT Alpine F1 Team',
  atsPlatform: 'Workday',
};

export const alpineWorkdayOptions: WorkdayCollectorOptions = {
  tenant: 'alliancewd',
  site: 'alpine-racing-careers',
};
