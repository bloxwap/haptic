import assert from 'node:assert/strict';
import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const manifest = JSON.parse(readFileSync('packages/haptic/package.json', 'utf8'));
const tag = process.env.RELEASE_TAG;
assert.match(tag ?? '', /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Set RELEASE_TAG to the exact version tag.');
assert.equal(tag, `v${manifest.version}`, 'Tag/package version mismatch.');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', `${tag}^{commit}`), git('rev-parse', 'HEAD'), 'Checkout must point at the exact release tag.');
git('merge-base', '--is-ancestor', 'HEAD', 'origin/main');
assert.equal(git('status', '--porcelain'), '', 'Release source must be clean.');
assert.equal(manifest.name, '@bloxwap/haptic');
assert.equal(manifest.publishConfig.access, 'public');
const devices = JSON.parse(readFileSync('.github/planning/device-results.json', 'utf8'));
assert.equal(devices.status, 'certified', 'Physical-device certification is pending in #9.');
assert.ok(devices.checkedAt && Number.isFinite(Date.parse(devices.checkedAt)), 'Missing device test date.');
assert.match(devices.testedCommit ?? '', /^[a-f0-9]{40}$/);
git('merge-base', '--is-ancestor', devices.testedCommit, 'HEAD');
assert.equal(git('diff', devices.testedCommit, 'HEAD', '--', 'packages/haptic/src'), '', 'Runtime changed after device testing.');
const testedManifest = JSON.parse(git('show', `${devices.testedCommit}:packages/haptic/package.json`));
for (const key of ['dependencies', 'peerDependencies']) assert.deepEqual(manifest[key], testedManifest[key], `${key} changed after device testing.`);
for (const kind of ['iphone-safari', 'android-chrome', 'ipados', 'voiceover']) {
  const result = devices.observations.find(item => item.kind === kind);
  assert.ok(result && ['pass', 'unsupported'].includes(result.result), `Missing device observation: ${kind}`);
  assert.ok(result.model && result.os && result.browser && result.settings && result.evidence, `Incomplete device observation: ${kind}`);
  if (kind === 'iphone-safari' || kind === 'android-chrome' || kind === 'voiceover') assert.equal(result.result, 'pass', `${kind} must pass.`);
}
const response = await fetch(`https://registry.npmjs.org/@bloxwap%2Fhaptic/${encodeURIComponent(manifest.version)}`, { signal: AbortSignal.timeout(30000) });
assert.equal(response.status, 404, response.ok ? 'This immutable version is already published; run registry:check, do not republish.' : `Unexpected registry response: ${response.status}`);
const distTag = manifest.version.includes('-') ? 'next' : 'latest';
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${manifest.version}\ndist_tag=${distTag}\n`);
console.log(`Release source ${tag} and device certification verified; ${manifest.name}@${manifest.version} will use ${distTag}.`);
