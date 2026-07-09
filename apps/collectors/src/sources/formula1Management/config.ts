import type { CollectorConfig } from '../../shared/collector.js';
import type { WorkdayCollectorOptions } from '../../workday/client.js';

export const formula1ManagementConfig: CollectorConfig = {
  id: 'workday-formula1-management',
  company: 'Formula One Management',
  atsPlatform: 'Workday',
};

export const formula1ManagementWorkdayOptions: WorkdayCollectorOptions = {
  tenant: 'formulaone',
  site: 'F1',
};
