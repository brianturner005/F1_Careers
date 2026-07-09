import type { Collector } from '../../shared/collector.js';
import { fetchWorkdayPostings } from '../../workday/client.js';
import { mercedesAmgPetronasConfig, mercedesAmgPetronasWorkdayOptions } from './config.js';

export const mercedesAmgPetronasCollector: Collector = {
  config: mercedesAmgPetronasConfig,
  fetch: () => fetchWorkdayPostings(mercedesAmgPetronasWorkdayOptions),
};
