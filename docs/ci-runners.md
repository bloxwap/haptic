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
| Homebrew `gnu-tar` (`gtar` on `PATH`) | `actions/upload-pages-artifact` archives with GNU tar on macOS |
| Homebrew `zstd` | `actions/cache` compression |
| `shasum` | Release artifact digests (`/usr/bin/shasum`) |
| Core Audio with a reachable output | Firefox WebAudio in browser tests |
| Writable `$RUNNER_TEMP` | Temporary files; workflows export `TMPDIR=$RUNNER_TEMP` for later steps |
| Network to GitHub, npm, and the Playwright CDN | Checkout, package install, browser download, OIDC, Pages, publish |

Node 24 and npm 11.6.1 are provisioned by the workflows (`actions/setup-node`, plus a global npm pin on the publish job). They do not need to be preinstalled, but the runner user must be able to write the Actions tool cache.

Keep the runner online under a regular user. Do not run jobs as root. macOS 14 or newer is expected for current Playwright browsers.

The repository, GitHub Pages environment, and runner group must allow these self-hosted machines. OIDC must stay enabled so `id-token: write` jobs can mint ID tokens.

## Playwright

`playwright install --with-deps` is Linux-only and is not used here. Jobs restore `~/Library/Caches/ms-playwright` and run `npx playwright install` for the browsers that job needs.

## npm provenance and OIDC

The publish job keeps `permissions.id-token: write`, `actions/setup-node` `registry-url: https://registry.npmjs.org`, and `npm publish --provenance`. No npm token secret is configured. GitHub mints OIDC ID tokens for self-hosted runners when `id-token: write` is set.

npm's public trusted-publishing docs currently list GitHub-hosted runners as the supported environment. This repository still publishes from the Mac mini fleet with the same OIDC/provenance flags so the attestation workflow identity stays `.github/workflows/publish_npm.yml`. Do not add a long-lived npm token to compensate.

## GitHub Pages

Documentation deploy keeps `pages: write` and `id-token: write` on the deploy job and uses `actions/configure-pages` / `actions/deploy-pages`. The build job uploads the static export with `actions/upload-pages-artifact`, which requires `gtar`.
