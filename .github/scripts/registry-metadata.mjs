import assert from 'node:assert/strict';

/** Compare registry claims to the source or exact tarball being verified. */
export function assertRegistryManifest(metadata, expected) {
  for (const key of ['name', 'version', 'repository', 'type', 'main', 'module', 'types', 'react-native', 'exports', 'sideEffects', 'dependencies', 'peerDependencies', 'peerDependenciesMeta']) {
    assert.deepEqual(metadata[key], expected[key], `Registry ${key} differs from the expected package manifest.`);
  }
}
