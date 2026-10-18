import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { waitForRegistryRelease } from './wait-for-registry.mjs';

const version = process.env.HAPTIC_REGISTRY_VERSION;
assert.match(version ?? '', /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Set HAPTIC_REGISTRY_VERSION to an exact published version.');
const { metadata, distTags } = await waitForRegistryRelease(version);
assert.equal(metadata.name, '@bloxwap/haptic'); assert.equal(metadata.version, version);
assert.equal(metadata.repository.url, 'git+https://github.com/bloxwap/haptic.git');
assert.equal(metadata.repository.directory, 'packages/haptic');
assert.deepEqual(metadata.dependencies, { 'web-haptics': '0.0.6' });
assert.deepEqual(metadata.peerDependencies, { react: '>=18', 'react-dom': '>=18' });
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
