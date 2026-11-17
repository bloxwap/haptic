import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertRegistryManifest } from './registry-metadata.mjs';
const expected = JSON.parse(readFileSync('packages/haptic/package.json', 'utf8'));
test('registry expectations follow the current package, including optional native peers and exports', () => {
  assertRegistryManifest(structuredClone(expected), expected);
  for (const key of ['peerDependencies', 'peerDependenciesMeta', 'exports', 'version']) {
    assert.throws(() => assertRegistryManifest({ ...expected, [key]: undefined }, expected), new RegExp(key));
  }
  assert.throws(() => assertRegistryManifest({ ...expected, peerDependencies: { react: '>=18', 'react-dom': '>=18' } }, expected));
});
