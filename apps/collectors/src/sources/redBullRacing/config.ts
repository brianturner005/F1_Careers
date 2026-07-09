import type { CollectorConfig } from '../../shared/collector.js';
import type { WorkdayCollectorOptions } from '../../workday/client.js';

export const redBullRacingConfig: CollectorConfig = {
  id: 'workday-red-bull-racing',
  company: 'Red Bull Racing',
  atsPlatform: 'Workday',
};

export const redBullRacingWorkdayOptions: WorkdayCollectorOptions = {
  tenant: 'redbulltechnology',
  site: 'RB_Racing',
};
