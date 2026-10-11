import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

export async function waitForRegistryRelease(version, {
  fetch: request = globalThis.fetch,
  now = Date.now,
  sleep = setTimeout,
  timeoutMs = 300000,
  intervalMs = 10000,
  onWait = console.log,
} = {}) {
  const deadline = now() + timeoutMs;
  const expectedTag = version.includes('-') ? 'next' : 'latest';
  let pending;
  do {
    const response = await request(`https://registry.npmjs.org/@bloxwap%2Fhaptic/${encodeURIComponent(version)}`, { signal: AbortSignal.timeout(30000) });
    assert.ok(response.ok || response.status === 404, `Unexpected registry version response: HTTP ${response.status}`);
    if (response.ok) {
      const metadata = await response.json();
      const index = await request('https://registry.npmjs.org/@bloxwap%2Fhaptic', { signal: AbortSignal.timeout(30000) });
      assert.ok(index.ok || index.status === 404, `Unexpected registry package response: HTTP ${index.status}`);
      if (index.ok) {
        const distTags = (await index.json())['dist-tags'];
        if (distTags?.[expectedTag] === version) return { metadata, distTags };
        pending = `dist-tag ${expectedTag} is ${distTags?.[expectedTag] ?? 'missing'}`;
      } else pending = 'package index returns HTTP 404';
    } else pending = 'version returns HTTP 404';
    const remaining = deadline - now();
    assert.ok(remaining > 0, `Registry publication unavailable after ${timeoutMs / 1000}s: ${pending}`);
    onWait(`Waiting for npm publication of @bloxwap/haptic@${version}: ${pending}.`);
    await sleep(Math.min(intervalMs, remaining));
  } while (true);
}
