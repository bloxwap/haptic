# Haptic docs on the HIG 872906a candidate · 2026-10-15

HIG: `0.1.0-candidate.sha872906a9`, dry-run tarballs packed from
[bloxwap/hig@872906a](https://github.com/bloxwap/hig/tree/872906a9071469af8714b3b6fb5cc7bd64d2d6f3) and vendored in
`vendor/bloxwap-hig/` (checksums enforced by `npm run lint`). Baseline: `main` at `71f84f4` (#26, HIG
`0.1.0-candidate.sha7c67a07c`). Rollback: revert the PR.

## Workarounds removed

| Upstream fix | Workaround in #26 | Now |
| --- | --- | --- |
| [hig#63](https://github.com/bloxwap/hig/issues/63) caret Radix peers | 48 nested Radix lockfile entries the docs never import | One Radix tree shared with Fumadocs/Vaul: 82 → 34 entries, 44 → 0 nested |
| [hig#63](https://github.com/bloxwap/hig/issues/63) overlay-free recipes | CodeWindow rebuilt from `Surface` + `Text` + focusable `pre` | `@bloxwap/hig-react/recipes/code-window`; the entry needs no Radix peer |
| [hig#64](https://github.com/bloxwap/hig/issues/64) TTFs out of web tokens | `check-export.mjs` walked the export for leaked `.ttf` faces | Export walk removed; `npm run lint` asserts the installed tokens package has no font binaries |
| [hig#65](https://github.com/bloxwap/hig/issues/65) token font variables | `.hig-button { font-family: var(--font-sans) }` | Removed; the smoke test asserts the button's first family is a loaded Bloxwap face |
| [hig#66](https://github.com/bloxwap/hig/issues/66) radius roles | `--docs-radius-surface: 14px`, `--docs-radius-nested: 10px` | `var(--hig-radius-xl)` / `var(--hig-radius-lg)` |
| [hig#69](https://github.com/bloxwap/hig/issues/69) Callout | `note`/`idea` unsupported; string titles only | `note`/`idea` map to HIG `note`/`tip`; ReactNode titles |

The install row stays SDK-specific (`$` prompt, inline `IconButton`). Its panel starts with text, so HIG
Tabs correctly keeps the panel as its tab stop. HIG buttons are 44 px by default since hig#80; coarse
pointers keep 48 px with one host `min-height` rule, and the smoke test checks 44 px on desktop and 48 px
on the Pixel 7 profile.

## Measurements (same `/haptic` export settings, Node 24.10.0, npm 11.6.1)

| Metric | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Vendored tarballs | 4,446,466 | 34,514 | −4,411,952 |
| Lockfile packages | 608 | 560 | −48 |
| Lockfile Radix entries (nested) | 82 (44) | 34 (0) | −48 (−44) |
| Exported CSS (raw / gzip) | 148,539 / 23,642 | 157,266 / 25,304 | +8,727 / +1,662 |
| Exported JS (raw / gzip) | 1,125,248 / 363,743 | 1,130,670 / 365,449 | +5,422 / +1,706 |
| Exported fonts | 12,965,628 | 12,965,628 | 0 |
| Whole static export (118 files) | 15,681,140 | 15,695,084 | +13,944 |
| Docs source CSS (`global.css` + `styles/tokens.css`, bytes / lines) | 17,371 / 223 | 17,658 / 226 | +287 / +3 |

The nested Radix tree was never imported, so removing it does not change the export. CSS grows because
HIG's stylesheet now ships the role variables, density/motion selectors and Callout severities; JS grows by
the HIG candidate's component changes (Tabs focus handling, messages, CodeWindow entry). Only the
`@bloxwap/hig-*` entries changed outside Radix in the lockfile.

## Screenshots

Playwright Chromium (browser, automated), reduced motion, external requests blocked, static export served at
`/haptic`, 1440×900 and 390×844: `{before,after}-{home,demo,api,examples,platforms}-{desktop,mobile}.png`.
Visually equivalent; HIG buttons are 4 px shorter on desktop (hig#80).

## Checks (macOS arm64)

| Command | Result |
| --- | --- |
| `rm -rf node_modules && npm ci` | pass; `npm ls` clean |
| `npm run lint` | pass: 3 vendored tarballs, CSS imports, palette ownership, no token font binaries |
| `npm run build`, `npm run typecheck`, `npm test` | pass (see PR) |
| `npm run docs:check` | pass; 9 documentation snippets type-checked |
| `NEXT_PUBLIC_BASE_PATH=/haptic npm run docs:build` | pass; static routes, assets and base-path links verified |
| `DOCS_PORT=5307 playwright test --project chromium --project webkit --project mobile-chromium` | 21/21 passed |

Firefox does not launch in this machine's sandbox; PR CI runs all four projects on Linux.

No physical iOS/Android device, simulator/emulator haptics, VoiceOver/TalkBack or tactile observation is
claimed; those remain haptic#9/#7.
