import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionsFromBunLock, parseJsonc } from './lockfiles-check.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('the committed bun.lock resolves a dependency graph', () => {
  const bunLock = parseJsonc(readFileSync(resolve(root, 'bun.lock'), 'utf8'));
  const versions = versionsFromBunLock(bunLock);
  assert.ok(versions.size > 0);
});

test('version sets ignore workspace links', () => {
  const bunLock = {
    packages: {
      left: ['left@1.0.0'],
      '@bloxwap/haptic': ['@bloxwap/haptic@workspace:packages/haptic'],
    },
  };
  const versions = versionsFromBunLock(bunLock);
  assert.deepEqual([...versions.keys()], ['left']);
  assert.deepEqual([...versions.get('left')], ['1.0.0']);
  bunLock.packages.left = ['left@2.0.0'];
  assert.deepEqual([...versionsFromBunLock(bunLock).get('left')], ['2.0.0']);
});
