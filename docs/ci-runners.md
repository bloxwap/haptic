# CI runners

Every GitHub Actions job in this repository runs on self-hosted Apple silicon Mac minis.

```yaml
runs-on: [self-hosted, macOS, ARM64]
```

Register each machine with those labels. GitHub's default self-hosted macOS ARM64 labels already match. Workflows never call `apt` or `sudo`; install tools on the machine before it accepts jobs.

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
| Network to GitHub, npm, and the Playwright CDN | Checkout, package install, browser download, OIDC, Pages, publish |

Node 24 and npm 11.6.1 are provisioned by the workflows (`actions/setup-node`, plus a global npm pin on the publish job). They do not need to be preinstalled, but the runner user must be able to write the Actions tool cache.

`actions/setup-node` uses `package-manager-cache: false` in every job. npm's local download cache already persists on the minis. Uploading that shared cache to GitHub caused the required Tests checks to remain in post-job cleanup for several minutes after all validation passed. Keep the local cache and `npm ci`; avoid archiving the machine-wide npm cache as part of each job. [setup-node documents the explicit opt-out](https://github.com/actions/setup-node#caching-global-packages-data).

Keep the runner online under a regular user. Do not run jobs as root. macOS 14 or newer is expected for current Playwright browsers.

The repository, GitHub Pages environment, and runner group must allow these self-hosted machines. OIDC must stay enabled so `id-token: write` jobs can mint ID tokens.

## Playwright

`playwright install --with-deps` is Linux-only and is not used here. Jobs run `npx playwright install` and reuse the on-disk `~/Library/Caches/ms-playwright` already shared across runners on each mini. Do not wrap that directory in `actions/cache`; uploading it stalls for many minutes and can timeout the job.

Playwright projects are Chromium and WebKit (plus mobile Chromium on docs). Firefox is not installed or tested: Nightly does not launch from a LaunchDaemon session on these minis.

CI writes `AppleKeyboardUIMode=2` so WebKit Tab moves between buttons. Keep System Settings → Keyboard → Keyboard navigation enabled on the login session if a WebKit focus test still fails after that write. After `playwright install`, CI clears `com.apple.quarantine` on `~/Library/Caches/ms-playwright`.

## npm provenance and OIDC

The publish job keeps `permissions.id-token: write`, `actions/setup-node` `registry-url: https://registry.npmjs.org`, and `npm publish --provenance`. No npm token secret is configured. GitHub mints OIDC ID tokens for self-hosted runners when `id-token: write` is set.

npm's public trusted-publishing docs currently list GitHub-hosted runners as the supported environment. This repository still publishes from the Mac mini fleet with the same OIDC/provenance flags so the attestation workflow identity stays `.github/workflows/publish_npm.yml`. Do not add a long-lived npm token to compensate.

## GitHub Pages

Documentation deploy keeps `pages: write` and `id-token: write` on the deploy job and uses `actions/configure-pages` / `actions/deploy-pages`. The build job uploads the static export with `actions/upload-pages-artifact`, which requires `gtar`.
