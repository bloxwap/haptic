# Releasing @bloxwap/haptic

The first release is tracked in [#14](https://github.com/bloxwap/haptic/issues/14). The maintainer requested publishing `0.1.0` after the brand cleanup. Physical-device and VoiceOver certification is still pending in #9. [The recorded initial release decision](planning/initial-release.json) permits only `0.1.0-rc.0` and `0.1.0` from the unchanged automated-tested implementation. It requires that limitation in the package and docs, rejects failed observations, and does not apply to later versions. Do not represent this decision as hardware certification.

## Validate the implementation

Use Node 24 and npm 11.6.1. From a clean checkout:

```sh
npm ci
npm run typecheck
npm run test:matrix
npm run size
npm run pack:check
npx playwright install chromium firefox webkit
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

This local publication uses the signed-in account and its required 2FA flow. It does not establish GitHub OIDC or build provenance. Keep the bootstrap credential local. Verify the published prerelease's identity/tarball and record that limitation in #14. The provenance-required registry workflow is intended for the subsequent OIDC publication.

## Configure the exact trusted publisher

In npm package settings select GitHub Actions with organization **bloxwap**, repository **haptic**, workflow filename **publish_npm.yml**, and no environment name (the workflow has none). Enable direct **npm publish** explicitly; staged publishing is a separate allowed action. Every job, including publish, runs on the self-hosted Mac mini fleet (`runs-on: [self-hosted, macOS, ARM64]`). Keep Node >=22.14, npm >=11.5.1, and an `id-token: write` publishing job so OIDC and `--provenance` stay enabled. Newly created trust must complete its first successful publication within two days. Check [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) and [docs/ci-runners.md](../docs/ci-runners.md) when executing this step.

Record the actual account/team access and configured publisher in #13. A committed workflow alone does not complete that task.

## Publish a tagged OIDC release

Commit the desired stable version (initially `0.1.0`), synchronize the docs dependency and lockfile, date the changelog, and update release notes. Recheck device evidence after any runtime/dependency change. Merge to main, wait for Tests and Documentation to pass, tag that exact main commit `v0.1.0`, then publish its GitHub release. Prerelease versions containing a hyphen use `next`; stable versions use `latest`.

`publish_npm.yml` checks out the release tag and fails on a mismatched version, source outside main, dirty source, missing device evidence without the scoped initial release decision, already-published version, or unexpected registry response. Validation runs the full package and docs checks, then packs and uploads one archive with SHA-256. The publishing job downloads and verifies that archive, repeats the release gate, and publishes it with OIDC/provenance from the same Mac mini runners. No ongoing npm token secret is configured. [npm's provenance documentation](https://docs.npmjs.com/generating-provenance-statements/) explains the public build attestation.

The final registry check waits up to five minutes for npm's processing to expose the exact version and intended dist-tag. Unexpected auth/server responses fail immediately; a persistent missing version or incorrect tag fails when the wait expires. It then validates metadata, dist-tag, attestation workflow/tag/commit, byte identity with the reviewed tarball, signature verification, isolated ESM/CJS/types/SSR/bundler consumers, and real browser actions from installed registry bytes in both React versions.

## Recovery and final evidence

Do not retry publication blindly after a network failure. Query the exact version first. An existing immutable version cannot be overwritten. If publication succeeded but verification failed, inspect that version and rerun the **Registry smoke** workflow with the exact version; do not hide the failure by installing workspace source. Fix defects with a new version. If publication never reached npm, resolve the auth/network error and rerun the failed release workflow. Dist-tags are checked explicitly; repair a wrong tag through an authorized account or a publisher whose allowed actions include dist-tag management.

```sh
npm view @bloxwap/haptic@0.1.0 version dist-tags repository dependencies peerDependencies dist.attestations --json
HAPTIC_REGISTRY_VERSION=0.1.0 npm run registry:check
DOCS_URL=https://bloxwap.github.io/haptic/ npm run docs:smoke
```

Attach the release/tag, exact npm version, tarball digest, validation/publish/registry/docs run URLs, trusted-publisher evidence, and device results to #14. Update docs and README release status/badges to the real published version, then close completed issues and #1 only when every prerequisite is substantiated.
