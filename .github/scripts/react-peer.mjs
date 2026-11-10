import { satisfies } from './semver.mjs';

/** Fail when a peer range admits a React major the matrix does not run. */
export function assertReactPeers(range, matrixVersions) {
  if (!Array.isArray(matrixVersions) || matrixVersions.length === 0) throw new Error('React matrix is empty.');
  const majors = new Set(matrixVersions.map(version => Number(version.split('.')[0])));
  for (const version of matrixVersions) {
    if (!satisfies(version, range)) throw new Error(`Matrix React ${version} does not satisfy the peer range ${range}.`);
  }
  for (const mentioned of range.matchAll(/\d+\.\d+\.\d+/g)) {
    const major = Number(mentioned[0].split('.')[0]);
    if (!majors.has(major)) throw new Error(`Peer range mentions React ${mentioned[0]}, which is not in the test matrix.`);
  }
  for (let major = 0; major <= 40; major += 1) {
    const probe = `${major}.0.0`;
    const allowed = satisfies(probe, range);
    if (allowed !== majors.has(major)) {
      throw new Error(allowed
        ? `React ${probe} matches ${range}, but the matrix does not test major ${major}.`
        : `The matrix tests React ${major}, but ${probe} does not match ${range}.`);
    }
  }
}
