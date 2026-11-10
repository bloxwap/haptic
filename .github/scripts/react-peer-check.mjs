import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matrixVersions } from '../../packages/haptic/scripts/react-versions.mjs';
import { assertReactPeers } from './react-peer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(resolve(root, 'packages/haptic/package.json'), 'utf8'));
const range = manifest.peerDependencies.react;
if (manifest.peerDependencies['react-dom'] !== range) {
  throw new Error(`react-dom peer range ${manifest.peerDependencies['react-dom']} must match react ${range}.`);
}
assertReactPeers(range, matrixVersions);
console.log(`React peer range ${range} matches the matrix (${matrixVersions.join(', ')}).`);
