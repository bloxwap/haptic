import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waitForRegistryRelease } from './wait-for-registry.mjs';

function registry(responses) {
  let time = 0;
  let requests = 0;
  return {
    options: {
      fetch: async () => {
        requests++;
        const [status, data] = responses.shift() ?? [404];
        return { status, ok: status === 200, json: async () => data };
      },
      now: () => time,
      sleep: async delay => { time += delay; },
      timeoutMs: 30,
      intervalMs: 10,
      onWait: () => {},
    },
    requests: () => requests,
  };
}

test('waits for the public version, package index, and stable dist-tag', async () => {
  const metadata = { name: '@bloxwap/haptic', version: '0.1.0' };
  const fixture = registry([[404], [200, metadata], [404], [200, metadata], [200, { 'dist-tags': { latest: '0.1.0-rc.0' } }], [200, metadata], [200, { 'dist-tags': { latest: '0.1.0' } }]]);
  assert.deepEqual(await waitForRegistryRelease('0.1.0', fixture.options), { metadata, distTags: { latest: '0.1.0' } });
});

test('requires next for prereleases', async () => {
  const metadata = { version: '0.1.0-rc.0' };
  const fixture = registry([[200, metadata], [200, { 'dist-tags': { next: '0.1.0-rc.0' } }]]);
  assert.equal((await waitForRegistryRelease('0.1.0-rc.0', fixture.options)).metadata, metadata);
});

for (const status of [401, 403, 500, 503]) {
  test(`rejects HTTP ${status} without treating it as publication processing`, async () => {
    const fixture = registry([[status]]);
    await assert.rejects(waitForRegistryRelease('0.1.0', fixture.options), new RegExp(`HTTP ${status}`));
    assert.equal(fixture.requests(), 1);
  });
}

test('fails when the version never becomes available', async () => {
  await assert.rejects(waitForRegistryRelease('0.1.0', registry([]).options), /publication unavailable.*version returns HTTP 404/);
});

test('fails when an incorrect dist-tag persists', async () => {
  const responses = Array.from({ length: 4 }, () => [[200, { version: '0.1.0' }], [200, { 'dist-tags': { latest: '0.1.0-rc.0' } }]]).flat();
  await assert.rejects(waitForRegistryRelease('0.1.0', registry(responses).options), /publication unavailable.*dist-tag latest is 0.1.0-rc.0/);
});
