#!/usr/bin/env node
// Builds a minimal, self-contained deploy folder for an Azure Functions app
// that's already been esbuild-bundled (see apps/*/package.json "bundle"
// script): just the bundle, host.json, and a dependency-free package.json.
//
// Why: the bundle inlines every @f1-job-radar/* workspace package and every
// third-party dependency (except @azure/functions-core, which the Functions
// host injects at run time), so nothing here needs `npm install` to run.
// But the *app's own* package.json still lists "@f1-job-radar/schema": "*"
// etc. — if we deployed that file as-is and Azure's remote (Oryx) build ran
// `npm install` against it, it would fail trying to resolve those unpublished
// workspace-local versions. Shipping a package.json with no dependencies at
// all sidesteps that regardless of whether remote build is disabled.
//
// Usage: node scripts/prepare-function-deploy.mjs <appDir>
// Writes <appDir>/deploy/{bundle.js,host.json,package.json}

import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const appDir = process.argv[2];
if (!appDir) {
  console.error('Usage: node scripts/prepare-function-deploy.mjs <appDir>');
  process.exit(1);
}

const appPackageJson = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf-8'));
const deployDir = join(appDir, 'deploy');

rmSync(deployDir, { recursive: true, force: true });
mkdirSync(deployDir, { recursive: true });

copyFileSync(join(appDir, 'dist', 'bundle.js'), join(deployDir, 'bundle.js'));
copyFileSync(join(appDir, 'host.json'), join(deployDir, 'host.json'));

const deployPackageJson = {
  name: appPackageJson.name,
  version: appPackageJson.version,
  private: true,
  type: 'module',
  main: 'bundle.js',
};
writeFileSync(join(deployDir, 'package.json'), `${JSON.stringify(deployPackageJson, null, 2)}\n`);

console.log(`Prepared ${deployDir} for deployment.`);
