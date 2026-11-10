import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertReactPeers } from './react-peer.mjs';

const matrix = ['18.3.1', '19.3.0'];

test('the tested majors are the only majors the peer range allows', () => {
  assert.doesNotThrow(() => assertReactPeers('^18.0.0 || ^19.0.0', matrix));
  assert.throws(() => assertReactPeers('>=18', matrix), /does not test major 20/);
  assert.throws(() => assertReactPeers('^18.0.0', matrix), /React 19\.3\.0 does not satisfy/);
  assert.throws(() => assertReactPeers('^18.3.1 || ^19.3.0', matrix), /18\.0\.0 does not match/);
});
