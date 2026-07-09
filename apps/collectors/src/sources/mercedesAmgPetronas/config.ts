import type { CollectorConfig } from '../../shared/collector.js';
import type { WorkdayCollectorOptions } from '../../workday/client.js';

export const mercedesAmgPetronasConfig: CollectorConfig = {
  id: 'workday-mercedes-amg-petronas',
  company: 'Mercedes-AMG Petronas F1 Team',
  atsPlatform: 'Workday',
};

export const mercedesAmgPetronasWorkdayOptions: WorkdayCollectorOptions = {
  tenant: 'mbgp',
  site: 'Mercedes-AMGF1',
};
