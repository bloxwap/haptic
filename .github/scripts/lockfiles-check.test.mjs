import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lockfileDiffs, parseJsonc } from './lockfiles-check.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('the committed lockfiles resolve one dependency graph', () => {
  const npmLock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  const bunLock = parseJsonc(readFileSync(resolve(root, 'bun.lock'), 'utf8'));
  const { packages, diffs } = lockfileDiffs(npmLock, bunLock);
  assert.equal(diffs.length, 0, diffs.join('\n'));
  assert.ok(packages > 0);
});

test('version sets ignore install paths and workspace links', () => {
  const npmLock = {
    packages: {
      'packages/haptic': { version: '0.3.0', name: '@bloxwap/haptic' },
      'node_modules/left': { version: '1.0.0', name: 'left' },
      'node_modules/nested/node_modules/left': { version: '1.0.0', name: 'left' },
      'node_modules/@bloxwap/haptic': { version: '0.3.0', link: true },
    },
  };
  const bunLock = {
    packages: {
      left: ['left@1.0.0'],
      '@bloxwap/haptic': ['@bloxwap/haptic@workspace:packages/haptic'],
    },
  };
  assert.deepEqual(lockfileDiffs(npmLock, bunLock).diffs, []);
  bunLock.packages.left = ['left@2.0.0'];
  assert.match(lockfileDiffs(npmLock, bunLock).diffs.join('\n'), /left: package-lock.json \[1\.0\.0\] vs bun.lock \[2\.0\.0\]/);
});
