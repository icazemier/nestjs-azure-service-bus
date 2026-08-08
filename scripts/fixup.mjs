/**
 * Marks each build output with its own module format.
 *
 * Node decides whether a .js file is ESM or CommonJS from the nearest
 * package.json "type". The root of this package is "module", so without these
 * two files the CommonJS build would be loaded as ESM and throw on its first
 * `exports` assignment.
 */
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';

const write = (directory, type) =>
  writeFile(
    join('build', directory, 'package.json'),
    `${JSON.stringify({ type }, undefined, 2)}\n`,
    'utf-8',
  );

await Promise.all([write('cjs', 'commonjs'), write('esm', 'module')]);
