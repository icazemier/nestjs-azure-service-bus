/**
 * Loads the built package the way a consumer does.
 *
 * The unit tests import the TypeScript sources, so they still pass when the
 * build emits to the wrong place, ships an unusable module format, or drops an
 * export. This resolves the package through its own `main` field and checks
 * that its public surface is actually there.
 */
import { createRequire } from 'node:module';
import { log, error } from 'node:console';
import process from 'node:process';

// Resolution is anchored at the package root so that `main`, which is written
// relative to package.json, means the same thing here as it does to a consumer.
const require = createRequire(new URL('../', import.meta.url));
const { main } = require('./package.json');

const EXPECTED_EXPORTS = [
  'AzureServiceBusModule',
  'AzureServiceBusAdminModule',
  'Sender',
  'Receiver',
  'Admin',
];

const built = require(main);
const missing = EXPECTED_EXPORTS.filter((name) => !(name in built));

if (missing.length > 0) {
  error(`${main} is missing: ${missing.join(', ')}`);
  process.exit(1);
}

log(`${main} exports ${EXPECTED_EXPORTS.join(', ')}`);
