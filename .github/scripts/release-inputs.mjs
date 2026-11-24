import assert from 'node:assert/strict';
/** Byte changes here require verification of the resulting build again. */
export const verifiedBuildPaths = [
  'packages/haptic/src', 'packages/haptic/tsup.config.ts', 'packages/haptic/tsconfig.json',
  'packages/haptic/scripts', 'bun.lock', '.npmrc', 'packages/haptic/.npmrc',
  '.github/workflows/publish_npm.yml',
];
export function assertBuildManifests(tested, current, testedRoot, currentRoot) {
  const packageKeys = ['type', 'main', 'module', 'types', 'react-native', 'exports', 'files', 'sideEffects', 'dependencies', 'devDependencies', 'peerDependencies', 'peerDependenciesMeta', 'optionalDependencies', 'scripts', 'engines', 'publishConfig'];
  const rootKeys = ['dependencies', 'devDependencies', 'overrides', 'engines', 'packageManager', 'workspaces', 'scripts'];
  for (const [before, after, keys] of [[tested, current, packageKeys], [testedRoot, currentRoot, rootKeys]]) {
    for (const key of keys) assert.deepEqual(after[key], before[key], `${key} changed after build verification.`);
  }
}
