import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

test('pending-certification decisions have unique versions and a recorded implementation', () => {
  const seen = new Set();
  const files = readdirSync('.github/planning').filter(name => name.endsWith('-release.json')).sort();
  assert.ok(files.includes('initial-release.json'));
  assert.ok(files.includes('0.2.0-release.json'));
  assert.ok(files.includes('0.3.0-release.json'));
  assert.ok(files.includes('0.4.0-release.json'));
  for (const name of files) {
    const decision = JSON.parse(readFileSync(`.github/planning/${name}`, 'utf8'));
    assert.equal(decision.deviceCertification, 'pending');
    assert.ok(decision.reason && Number.isFinite(Date.parse(decision.decidedAt)), `Missing decision metadata in ${name}.`);
    assert.match(decision.implementationCommit ?? '', /^[a-f0-9]{40}$/, `Invalid implementation commit in ${name}.`);
    assert.ok(Array.isArray(decision.versions) && decision.versions.length > 0, `Missing versions in ${name}.`);
    for (const version of decision.versions) {
      assert.equal(seen.has(version), false, `Version ${version} is claimed by more than one pending-certification decision.`);
      seen.add(version);
    }
  }
  assert.ok(seen.has('0.1.0'));
  assert.ok(seen.has('0.2.0'));
  assert.ok(seen.has('0.3.0'));
  assert.ok(seen.has('0.4.0'));
});

import { assertBuildManifests, verifiedBuildPaths } from './release-inputs.mjs';
test('verification covers export routing, packaging and build tooling while allowing release prose', () => {
  const library = JSON.parse(readFileSync('packages/haptic/package.json', 'utf8'));
  const root = JSON.parse(readFileSync('package.json', 'utf8'));
  assertBuildManifests(library, { ...library, description: 'Release prose' }, root, root);
  for (const key of ['exports', 'main', 'react-native', 'files', 'sideEffects', 'devDependencies', 'peerDependenciesMeta', 'scripts']) {
    assert.throws(() => assertBuildManifests(library, { ...library, [key]: null }, root, root), new RegExp(key));
  }
  for (const key of ['overrides', 'scripts', 'engines']) {
    assert.throws(() => assertBuildManifests(library, library, root, { ...root, [key]: null }), new RegExp(key));
  }
  for (const path of ['packages/haptic/tsup.config.ts', 'package-lock.json', 'bun.lock', '.github/workflows/publish_npm.yml']) assert.ok(verifiedBuildPaths.includes(path));
});
