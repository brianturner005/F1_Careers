#!/usr/bin/env node
// Seeds the `sources` container with the 7 known sources -- replaces the old
// SQL seed migrations (0002/0004/0005). Every collector's config.id needs a
// row here before its first run, since recordCollectorRun() patches the
// matching source document (fails if it doesn't already exist).
//
// Usage: COSMOS_CONNECTION_STRING=... COSMOS_DATABASE_NAME=... node scripts/seed-cosmos.mjs

import { CosmosClient } from '@azure/cosmos';

const connectionString = process.env.COSMOS_CONNECTION_STRING;
const databaseName = process.env.COSMOS_DATABASE_NAME;

if (!connectionString || !databaseName) {
  console.error(
    'Set COSMOS_CONNECTION_STRING and COSMOS_DATABASE_NAME before running this script.',
  );
  process.exit(1);
}

const sources = [
  {
    id: 'workday-red-bull-racing',
    displayName: 'Red Bull Racing (Workday)',
    company: 'Oracle Red Bull Racing',
    atsPlatform: 'Workday',
    status: 'healthy',
    lastRunAt: null,
  },
  {
    id: 'workday-mercedes-amg-petronas',
    displayName: 'Mercedes-AMG Petronas (Workday)',
    company: 'Mercedes-AMG Petronas F1 Team',
    atsPlatform: 'Workday',
    status: 'healthy',
    lastRunAt: null,
  },
  {
    id: 'workday-alpine',
    displayName: 'Alpine (Workday)',
    company: 'BWT Alpine F1 Team',
    atsPlatform: 'Workday',
    status: 'healthy',
    lastRunAt: null,
  },
  {
    id: 'pinpoint-aston-martin',
    displayName: 'Aston Martin Aramco (Pinpoint)',
    company: 'Aston Martin Aramco Formula One Team',
    atsPlatform: 'Pinpoint',
    status: 'healthy',
    lastRunAt: null,
  },
  {
    id: 'workable-cadillac',
    displayName: 'Cadillac F1 (Workable)',
    company: 'Cadillac Formula 1 Team',
    atsPlatform: 'Workable',
    status: 'healthy',
    lastRunAt: null,
  },
  {
    id: 'workday-formula1-management',
    displayName: 'Formula One Management (Workday)',
    company: 'Formula One Management',
    atsPlatform: 'Workday',
    status: 'healthy',
    lastRunAt: null,
  },
  {
    id: 'trakstar-pirelli',
    displayName: 'Pirelli (Trakstar)',
    company: 'Pirelli',
    atsPlatform: 'Trakstar',
    status: 'healthy',
    lastRunAt: null,
  },
];

const client = new CosmosClient(connectionString);
const container = client.database(databaseName).container('sources');

for (const source of sources) {
  await container.items.upsert(source);
  console.log(`seeded: ${source.id}`);
}

console.log(`Done -- ${sources.length} sources seeded.`);
