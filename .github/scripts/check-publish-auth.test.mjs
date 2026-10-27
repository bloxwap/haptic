import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('check-publish-auth fails closed without a token and does not print secrets', () => {
  const script = fileURLToPath(new URL('check-publish-auth.mjs', import.meta.url));
  const env = { ...process.env, NODE_AUTH_TOKEN: '', NPM_TOKEN: '', ACTIONS_ID_TOKEN_REQUEST_URL: '', ACTIONS_ID_TOKEN_REQUEST_TOKEN: '' };
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', env });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /NPM_TOKEN is missing/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /npm_[A-Za-z0-9]{8,}/);
});

for (const [url, token, succeeds] of [
  ['https://oidc.invalid', 'test-oidc-secret', true],
  ['https://oidc.invalid', '', false],
  ['', 'test-oidc-secret', false],
]) {
  test(`check-publish-auth requires both OIDC variables (URL=${Boolean(url)}, token=${Boolean(token)})`, () => {
    const script = fileURLToPath(new URL('check-publish-auth.mjs', import.meta.url));
    const env = {
      ...process.env, NODE_AUTH_TOKEN: '', NPM_TOKEN: '',
      ACTIONS_ID_TOKEN_REQUEST_URL: url, ACTIONS_ID_TOKEN_REQUEST_TOKEN: token,
    };
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8', env });
    const output = `${result.stdout}\n${result.stderr}`;
    if (succeeds) {
      assert.equal(result.status, 0);
      assert.match(output, /::notice::.*npm trusted publishing/);
    } else {
      assert.notEqual(result.status, 0);
      assert.match(output, /NPM_TOKEN is missing/);
    }
    assert.doesNotMatch(output, /test-oidc-secret/);
  });
}
