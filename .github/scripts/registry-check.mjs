import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const version = process.env.HAPTIC_REGISTRY_VERSION;
assert.match(version ?? '', /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Set HAPTIC_REGISTRY_VERSION to an exact published version.');
const response = await fetch(`https://registry.npmjs.org/@bloxwap%2Fhaptic/${encodeURIComponent(version)}`, { signal: AbortSignal.timeout(30000) });
assert.ok(response.ok, `Registry version unavailable: HTTP ${response.status}`);
const metadata = await response.json();
assert.equal(metadata.name, '@bloxwap/haptic'); assert.equal(metadata.version, version);
assert.equal(metadata.repository.url, 'git+https://github.com/bloxwap/haptic.git');
assert.equal(metadata.repository.directory, 'packages/haptic');
assert.deepEqual(metadata.dependencies, { 'web-haptics': '0.0.6' });
assert.deepEqual(metadata.peerDependencies, { react: '>=18', 'react-dom': '>=18' });
const expectedTag = version.includes('-') ? 'next' : 'latest';
const index = await fetch('https://registry.npmjs.org/@bloxwap%2Fhaptic', { signal: AbortSignal.timeout(30000) });
assert.ok(index.ok); assert.equal((await index.json())['dist-tags'][expectedTag], version);
assert.equal(metadata.dist.attestations?.provenance?.predicateType, 'https://slsa.dev/provenance/v1', 'Missing build provenance.');
const attestation = await fetch(metadata.dist.attestations.url, { signal: AbortSignal.timeout(30000) });
assert.ok(attestation.ok); const attestations = await attestation.json();
const provenance = attestations.attestations.find(item => item.predicateType === 'https://slsa.dev/provenance/v1');
assert.ok(provenance, 'Missing provenance attestation.');
const statement = JSON.parse(Buffer.from(provenance.bundle.dsseEnvelope.payload, 'base64').toString());
assert.equal(statement.predicate.buildDefinition.externalParameters.workflow.repository, 'https://github.com/bloxwap/haptic');
assert.equal(statement.predicate.buildDefinition.externalParameters.workflow.path, '.github/workflows/publish_npm.yml');
assert.equal(statement.predicate.buildDefinition.externalParameters.workflow.ref, `refs/tags/v${version}`);
if (process.env.HAPTIC_EXPECTED_COMMIT) assert.equal(statement.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit, process.env.HAPTIC_EXPECTED_COMMIT);
if (process.env.HAPTIC_EXPECTED_TARBALL) {
  const archive = await fetch(metadata.dist.tarball, { signal: AbortSignal.timeout(30000) }); assert.ok(archive.ok);
  const registryHash = createHash('sha512').update(Buffer.from(await archive.arrayBuffer())).digest('hex');
  const localHash = createHash('sha512').update(readFileSync(process.env.HAPTIC_EXPECTED_TARBALL)).digest('hex');
  assert.equal(registryHash, localHash, 'Published tarball differs from the validated artifact.');
}
execFileSync('node', ['scripts/pack-check.mjs'], { cwd: 'packages/haptic', stdio: 'inherit', env: process.env });
console.log(`Registry metadata, dist-tag, provenance, and real installed consumers verified for @bloxwap/haptic@${version}.`);
