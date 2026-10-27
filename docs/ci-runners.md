# CI runners

GitHub Actions jobs run on self-hosted Apple silicon Mac minis, except the npm `publish` job described below.

```yaml
runs-on: [self-hosted, macOS, ARM64]
```

Register each machine with those labels. GitHub's default self-hosted macOS ARM64 labels already match. Jobs on the minis never call `apt` or `sudo`; install tools on the machine before it accepts jobs.

## Required software

| Tool | Why |
| --- | --- |
| GitHub Actions runner 2.327.1 or newer | Node 24 actions (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/cache@v5`, artifact v7/v8) |
| Labels `self-hosted`, `macOS`, `ARM64` | Job targeting |
| Xcode Command Line Tools | Git, clang, and Playwright WebKit |
| Homebrew `gnu-tar` (`gtar` in `/opt/homebrew/bin` or `/usr/local/bin`) | `actions/upload-pages-artifact` archives with GNU tar on macOS. CI prepends those dirs to `PATH` |
| Homebrew `zstd` | `actions/setup-node` npm cache compression |
| `shasum` | Release artifact digests (`/usr/bin/shasum`) |
| Core Audio with a reachable output | Browser WebAudio in debug-audio tests |
| Writable `$RUNNER_TEMP` | Script scratch files (`start-test-audio.sh`, Node `mkdtemp`) |
| Network to GitHub, npm, and the Playwright CDN | Checkout, package install, browser download, Pages OIDC, publish |

Node 24 and npm 11.6.1 are provisioned by the workflows (`actions/setup-node`, plus a global npm pin on the publish job). They do not need to be preinstalled, but the runner user must be able to write the Actions tool cache.

`actions/setup-node` uses `package-manager-cache: false` in every job. npm's local download cache already persists on the minis. Uploading that shared cache to GitHub caused the required Tests checks to remain in post-job cleanup for several minutes after all validation passed. Keep the local cache and `npm ci`; avoid archiving the machine-wide npm cache as part of each job. [setup-node documents the explicit opt-out](https://github.com/actions/setup-node#caching-global-packages-data).

Keep the runner online under a regular user. Do not run jobs as root. macOS 14 or newer is expected for current Playwright browsers.

The repository, GitHub Pages environment, and runner group must allow these self-hosted machines. OIDC must stay enabled so the Pages deploy job can mint ID tokens.

## Playwright

The Ubuntu publish job uses `npx playwright install --with-deps chromium` before its registry check. On the minis, jobs run `npx playwright install` and reuse the on-disk `~/Library/Caches/ms-playwright` already shared across runners on each mini. Do not wrap that directory in `actions/cache`; uploading it stalls for many minutes and can timeout the job.

Playwright projects are Chromium and WebKit (plus mobile Chromium on docs). Firefox is not installed or tested: Nightly does not launch from a LaunchDaemon session on these minis.

CI writes `AppleKeyboardUIMode=2` so WebKit Tab moves between buttons. Keep System Settings → Keyboard → Keyboard navigation enabled on the login session if a WebKit focus test still fails after that write. After `playwright install`, CI clears `com.apple.quarantine` on `~/Library/Caches/ms-playwright`.

## npm trusted publishing

Only the `publish` job in `.github/workflows/publish_npm.yml` runs on GitHub-hosted `ubuntu-24.04`, a narrow exception to the Mac-mini-only runner policy because [npm trusted publishing requires GitHub-hosted runners](https://docs.npmjs.com/trusted-publishers/). Validation and security stay on the minis. Publishing uses Node 24, pinned npm 11.6.1, `contents: read` and `id-token: write`, and `--provenance`, including during token fallback. It downloads and SHA-256-verifies the exact `npm-package` tarball produced by validation; it does not repack it.

Create the GitHub `npm-release` environment and configure required reviewers in repository settings. The workflow references that environment, but YAML alone does not enable approval protection. On npmjs.com, configure the Trusted Publisher for `@bloxwap/haptic`: organization **bloxwap**, repository **haptic**, workflow filename **publish_npm.yml**, environment **npm-release**, with direct publishing allowed. Keep the workflow filename unchanged.

Keep the org-level `NPM_TOKEN` available to this repository as a transitional fallback until trusted publishing is verified. It is exposed as `NODE_AUTH_TOKEN` only to the auth check and publish steps. npm tries OIDC first and falls back to the token if no trusted publisher is configured, so releases can continue before npm setup. After verifying an OIDC publication and its provenance, delete the secret and the two fallback env entries. The auth check accepts OIDC without a token; token-only commands such as `npm whoami`, collaborator checks, `npm deprecate`, and `npm access` still require separate token authentication.

## GitHub Pages

Documentation deploy keeps `pages: write` and `id-token: write` on the deploy job and uses `actions/configure-pages` / `actions/deploy-pages`. The build job still compiles, checks, and smokes the docs on every same-repo PR. It uploads the static export with `actions/upload-pages-artifact` only when deploy will run (push to `main` or `workflow_dispatch`), because PRs never deploy and the unused upload stalled the minis. That step requires `gtar`. GitHub Pages uses OIDC on the self-hosted runners. npm publication uses the GitHub-hosted exception above.

Tests and Documentation keep a per-ref concurrency group. `cancel-in-progress` is true for pull requests only, so superseded PR jobs free the minis and a later push does not abort an in-flight Pages deploy.
