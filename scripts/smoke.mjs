/**
 * Loads the built package the way a consumer does, through both entry points.
 *
 * The unit tests import the TypeScript sources, so they still pass when the
 * build emits to the wrong place, marks an output with the wrong module format
 * or drops an export. This resolves the package through its own `exports` map
 * and checks that its public surface is actually there in both builds.
 */
import { createRequire } from 'node:module';
import { log, error } from 'node:console';
import process from 'node:process';

// Resolution is anchored at the package root so that the paths in package.json,
// which are written relative to it, mean the same thing here as to a consumer.
const packageRoot = new URL('../', import.meta.url);
const require = createRequire(packageRoot);
const { main, module: esmEntry } = require('./package.json');

const EXPECTED_EXPORTS = [
  'AzureServiceBusModule',
  'AzureServiceBusAdminModule',
  'AzureServiceBusClientLifecycle',
  'Sender',
  'Receiver',
  'Admin',
  'AZURE_SERVICE_BUS_CLIENT',
  'AZURE_SERVICE_BUS_ADMIN_CLIENT',
  'senderToken',
  'receiverToken',
];

const check = (label, loaded) => {
  const missing = EXPECTED_EXPORTS.filter((name) => !(name in loaded));

  if (missing.length > 0) {
    error(`${label} is missing: ${missing.join(', ')}`);
    return false;
  }

  log(`${label} exports all ${EXPECTED_EXPORTS.length} public names`);
  return true;
};

const commonJsBuild = require(main);
const esmBuild = await import(new URL(esmEntry, packageRoot));

// Both are checked before either verdict is used, so a run reports every
// broken build rather than stopping at the first.
const commonJsLoaded = check(main, commonJsBuild);
const esmLoaded = check(esmEntry, esmBuild);

// The token helpers are the one piece of behaviour the two builds must agree
// on: a consumer loading both copies has to get the same injection token, or a
// provider registered through one is invisible to the other.
const agree =
  commonJsBuild.senderToken('orders') === esmBuild.senderToken('orders');

if (!agree) error('the two builds derive different sender tokens');

if (!commonJsLoaded || !esmLoaded || !agree) process.exit(1);

log('both builds load and agree on their tokens');
