import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

test('pending-certification decisions have unique versions and a recorded implementation', () => {
  const seen = new Set();
  const files = readdirSync('.github/planning').filter(name => name.endsWith('-release.json')).sort();
  assert.ok(files.includes('initial-release.json'));
  assert.ok(files.includes('0.2.0-release.json'));
  assert.ok(files.includes('0.3.0-release.json'));
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
});
