/**
 * Asserts that the registry actually serves the version in package.json.
 *
 * Publishing is idempotent by design — npm skips a version it already has and
 * exits 0 — which means a green publish step proves nothing. This checks the
 * end state instead of the exit code, so a release that silently shipped
 * nothing fails the run.
 */
import { readFileSync } from 'node:fs';
import { log, error } from 'node:console';
import { setTimeout as sleep } from 'node:timers/promises';
import process from 'node:process';

const { name, version } = JSON.parse(readFileSync('package.json', 'utf-8'));

// A publish is visible to the registry API within seconds, but not always
// instantly, so a miss is retried before it is called a failure.
const RETRIES = 5;
const RETRY_DELAY_MS = 4000;

const url = `https://registry.npmjs.org/${name}`;
let served = false;

for (let attempt = 1; attempt <= RETRIES && !served; attempt++) {
  try {
    const response = await globalThis.fetch(url, {
      headers: { accept: 'application/json' },
    });

    if (response.ok) {
      const body = await response.json();
      served = Object.hasOwn(body.versions ?? {}, version);
    }
  } catch (reason) {
    // A registry being unreachable is indistinguishable from one that has not
    // caught up yet, so it is retried rather than crashing the run.
    log(`  npm: unreachable (${reason.message}), retrying`);
  }

  if (!served && attempt < RETRIES) await sleep(RETRY_DELAY_MS);
}

if (!served) {
  error(`  npm: does NOT serve ${version}`);
  error(`${name}@${version} is not available on npm`);
  process.exit(1);
}

log(`${name}@${version} is live on npm`);
