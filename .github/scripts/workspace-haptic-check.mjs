import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { satisfies } from './semver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const haptic = JSON.parse(readFileSync(resolve(root, 'packages/haptic/package.json'), 'utf8'));
const docs = JSON.parse(readFileSync(resolve(root, 'apps/docs/package.json'), 'utf8'));
const spec = docs.dependencies['@bloxwap/haptic'];
if (spec !== haptic.version) {
  throw new Error(`apps/docs depends on @bloxwap/haptic@${spec}, but the workspace package is ${haptic.version}.`);
}

const link = resolve(root, 'node_modules/@bloxwap/haptic');
if (!lstatSync(link).isSymbolicLink()) throw new Error('node_modules/@bloxwap/haptic must be a symlink to the workspace package.');
if (realpathSync(link) !== realpathSync(resolve(root, 'packages/haptic'))) {
  throw new Error('node_modules/@bloxwap/haptic does not point at packages/haptic.');
}

const hig = JSON.parse(readFileSync(resolve(root, 'node_modules/@bloxwap/hig/package.json'), 'utf8'));
const peerRange = hig.peerDependencies['@bloxwap/haptic'];
if (!satisfies(haptic.version, peerRange)) {
  throw new Error(`Workspace @bloxwap/haptic@${haptic.version} is outside the installed @bloxwap/hig peer range ${peerRange}.`);
}
console.log(`Docs depend on workspace @bloxwap/haptic@${haptic.version}, inside @bloxwap/hig ${peerRange}.`);
