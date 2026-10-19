# Releasing @bloxwap/haptic

The first release is tracked in [#14](https://github.com/bloxwap/haptic/issues/14). Physical-device and VoiceOver certification is still pending in #9. Scoped pending-certification decisions live in [planning `*-release.json` files](planning/): [initial-release.json](planning/initial-release.json) covers `0.1.0-rc.0` and `0.1.0`; [0.2.0-release.json](planning/0.2.0-release.json) covers the imperative API release. Each decision pins an implementation commit, requires pending-certification disclosure in the package and docs, rejects failed observations, and does not apply to later versions. Do not represent these decisions as hardware certification.

## Validate the implementation

Use Node 24 and npm 11.6.1. From a clean checkout:

```sh
npm ci
npm run typecheck
npm run test:matrix
npm run size
npm run pack:check
npx playwright install chromium webkit
npm run test:browser
npm run docs:check
NEXT_PUBLIC_BASE_PATH=/haptic npm run docs:build
npm run docs:smoke
npm audit --audit-level=high
```

The packed-consumer check verifies eight allowlisted files, ESM/CJS imports and declarations, all public types, JSX, SSR without browser globals, React 18/19, and browser bundling outside the workspace. The gzip budget includes `web-haptics` and excludes React. The matrix runs the entire component/hook/hydration/lifecycle suite in isolated React installations.

Use [DEVICE_TESTING.md](DEVICE_TESTING.md) and record real observations in `planning/device-results.json`. Commit the evidence after testing. Record the tested implementation commit; the release gate requires its runtime source and runtime/peer dependency declarations to match the tagged source. Documentation, test reports, and version-only changes can follow that commit. Keep failed/unsupported observations explicit and investigate failures. Until those checks occur, the initial release uses the scoped decision above and keeps device results pending.

## Establish npm access and bootstrap

Run `npm login --registry=https://registry.npmjs.org` locally, then `npm whoami` and verify that account's organization role/team can publish `@bloxwap/haptic`. Check the name with `npm view @bloxwap/haptic`; HTTP 404 means unavailable publicly, not permission granted. Never put credentials in the repository or ask collaborators to send them in a conversation.

A new package needs an initial real publication before its package settings exist. Use an implementation prerelease such as `0.1.0-rc.0`, rather than consuming the intended stable version for the bootstrap. Update `packages/haptic/package.json`, the docs' workspace dependency, the authoritative lockfile, and changelog; commit and tag the source `v0.1.0-rc.0`. Complete all automated checks above and satisfy the recorded certification or initial release decision before bootstrapping.

Build and retain the exact reviewed artifact, recording its SHA-256:

```sh
RELEASE_TAG=v0.1.0-rc.0 npm run release:check
npm run pack:haptic
shasum -a 256 bloxwap-haptic-0.1.0-rc.0.tgz
npm publish ./bloxwap-haptic-0.1.0-rc.0.tgz --access public --tag next
```

This local publication uses the signed-in account and its required 2FA flow. Keep the bootstrap credential local. Verify the published prerelease's identity/tarball and record that limitation in #14. Subsequent CI publications authenticate with the org-level `NPM_TOKEN` secret.

## Configure npm token authentication

[npm trusted publishing does not support self-hosted runners](https://docs.npmjs.com/trusted-publishers/). Every job, including publish, runs on the self-hosted Mac mini fleet (`runs-on: [self-hosted, macOS, ARM64]`). The publish job authenticates with the org-level `NPM_TOKEN` secret (`NODE_AUTH_TOKEN`) that has publish rights for `@bloxwap` packages. That drops OIDC trusted publishing and automatic provenance. Keep Node 24 and npm 11.6.1. Check [docs/ci-runners.md](../docs/ci-runners.md) when executing this step.

Record the actual account/team access and token availability in #13. A committed workflow alone does not complete that task.

## Publish a tagged release

Commit the desired stable version, synchronize the docs dependency and lockfile, date the changelog, and update release notes. Recheck device evidence after any runtime/dependency change. Merge to main, wait for Tests and Documentation to pass, tag that exact main commit (`v0.2.0` for this release), then publish its GitHub release. Prerelease versions containing a hyphen use `next`; stable versions use `latest`.

`publish_npm.yml` checks out the release tag and fails on a mismatched version, source outside main, dirty source, missing device evidence without a matching pending-certification `*-release.json` decision, already-published version, or unexpected registry response. Validation runs the full package and docs checks, then packs and uploads one archive with SHA-256. The publishing job downloads and verifies that archive, repeats the release gate, checks `NPM_TOKEN` authentication, and publishes it from the same Mac mini runners. Token publish does not attach provenance.

The final registry check waits up to five minutes for npm's processing to expose the exact version and intended dist-tag. Unexpected auth/server responses fail immediately; a persistent missing version or incorrect tag fails when the wait expires. It then validates metadata, dist-tag, byte identity with the reviewed tarball, isolated ESM/CJS/types/SSR/bundler consumers, and real browser actions from installed registry bytes in both React versions.

## Recovery and final evidence

Do not retry publication blindly after a network failure. Query the exact version first. An existing immutable version cannot be overwritten. If publication succeeded but verification failed, inspect that version and rerun the **Registry smoke** workflow with the exact version; do not hide the failure by installing workspace source. Fix defects with a new version. If publication never reached npm, resolve the auth/network error and rerun the failed release workflow. Dist-tags are checked explicitly; repair a wrong tag through an authorized account or a publisher whose allowed actions include dist-tag management.

```sh
npm view @bloxwap/haptic@0.2.0 version dist-tags repository dependencies peerDependencies dist.tarball --json
HAPTIC_REGISTRY_VERSION=0.2.0 npm run registry:check
DOCS_URL=https://bloxwap.github.io/haptic/ npm run docs:smoke
```

Attach the release/tag, exact npm version, tarball digest, validation/publish/registry/docs run URLs, and device results to #14. Update docs and README release status/badges to the real published version, then close completed issues and #1 only when every prerequisite is substantiated.
