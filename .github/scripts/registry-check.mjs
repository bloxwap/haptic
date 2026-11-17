import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { waitForRegistryRelease } from './wait-for-registry.mjs';
import { assertRegistryManifest } from './registry-metadata.mjs';

const version = process.env.HAPTIC_REGISTRY_VERSION;
assert.match(version ?? '', /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Set HAPTIC_REGISTRY_VERSION to an exact published version.');
const { metadata, distTags } = await waitForRegistryRelease(version);
const expected = JSON.parse(process.env.HAPTIC_EXPECTED_TARBALL
  ? execFileSync('tar', ['-xOf', process.env.HAPTIC_EXPECTED_TARBALL, 'package/package.json'], { encoding: 'utf8' })
  : readFileSync('packages/haptic/package.json', 'utf8'));
assert.equal(expected.version, version, 'Check out the requested release or supply HAPTIC_EXPECTED_TARBALL.');
assertRegistryManifest(metadata, expected);
const expectedTag = version.includes('-') ? 'next' : 'latest';
assert.equal(distTags[expectedTag], version);
if (process.env.HAPTIC_EXPECTED_TARBALL) {
  const archive = await fetch(metadata.dist.tarball, { signal: AbortSignal.timeout(30000) }); assert.ok(archive.ok);
  const registryHash = createHash('sha512').update(Buffer.from(await archive.arrayBuffer())).digest('hex');
  const localHash = createHash('sha512').update(readFileSync(process.env.HAPTIC_EXPECTED_TARBALL)).digest('hex');
  assert.equal(registryHash, localHash, 'Published tarball differs from the validated artifact.');
}
execFileSync('node', ['scripts/pack-check.mjs'], { cwd: 'packages/haptic', stdio: 'inherit', env: process.env });
console.log(`Registry metadata, dist-tag, and real installed consumers verified for @bloxwap/haptic@${version}.`);
