import { test } from 'node:test';
import assert from 'node:assert/strict';
import { satisfies } from './semver.mjs';

test('npm caret, tilde, and comparator ranges', () => {
  assert.equal(satisfies('0.3.0', '^0.2.0 || ^0.3.0'), true);
  assert.equal(satisfies('0.2.9', '^0.2.0 || ^0.3.0'), true);
  assert.equal(satisfies('0.4.0', '^0.2.0 || ^0.3.0'), false);
  assert.equal(satisfies('0.3.0-rc.0', '^0.3.0'), false);
  assert.equal(satisfies('18.3.1', '^18.0.0 || ^19.0.0'), true);
  assert.equal(satisfies('19.3.0', '^18.0.0 || ^19.0.0'), true);
  assert.equal(satisfies('18.0.0', '^18.0.0 || ^19.0.0'), true);
  assert.equal(satisfies('20.0.0', '^18.0.0 || ^19.0.0'), false);
  assert.equal(satisfies('17.9.0', '^18.0.0 || ^19.0.0'), false);
  assert.equal(satisfies('20.0.0', '>=18'), true);
  assert.equal(satisfies('18.0.0', '>=18 <20'), true);
  assert.equal(satisfies('20.0.0', '>=18 <20'), false);
  assert.equal(satisfies('1.2.3', '~1.2.0'), true);
  assert.equal(satisfies('1.3.0', '~1.2.0'), false);
  assert.equal(satisfies('1.2.3', '1.2.3'), true);
  assert.throws(() => satisfies('1.0.0', '^1'), /Unsupported version range token/);
});
