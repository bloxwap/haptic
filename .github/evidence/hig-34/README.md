# Haptic docs on HIG packages · bloxwap/hig#34 · 2026-10-14

HIG: `0.1.0-candidate.sha7c67a07c`, dry-run tarballs packed from
[bloxwap/hig@7c67a07](https://github.com/bloxwap/hig/tree/7c67a07c) and vendored in
`vendor/bloxwap-hig/` (checksums enforced by `npm run lint`). Baseline: `main` at
`e64c32c` (#25, which used a copied HIG CSS file). Rollback: revert the PR.

## What moved to HIG

| Surface | Before | After |
| --- | --- | --- |
| Palette/spacing tokens | copied `styles/hig/tokens.css` (HIG@1a776b9) + aliases | `@import '@bloxwap/hig-tokens/css'`; bridge only maps to Fumadocs names |
| Control geometry | local `.btn*`, `.switch`, `.board-slider`, `.demo-input`, `.install-tabs` recipes | `@import '@bloxwap/hig-react/css'` + HIG components |
| Install / copy | hand-written tablist + lucide icons | HIG `Tabs` + `IconButton` (+ HIG `CheckIcon`) |
| Demo settings | custom switch/slider markup | HIG `Switch`, `Slider` |
| Forms / actions | `.btn` buttons, `.demo-input` | HIG `Button`, `Field` + `Input`; links/Vaul close use `.hig-button` |
| Code window | local toolbar/window chrome | HIG `Surface` + `Text` + focusable `pre` (CodeWindow composition) |
| Callouts | none (plain paragraphs) | MDX `Callout` renders HIG `Callout` (warning on hardware limits) |
| Fonts | `@bloxwap/font` Next loaders | unchanged (HIG: Next loaders stay upstream-owned) |

Kept SDK-owned: the 12-target preset board, `Haptic` wrappers, Vaul drawer demo,
Fumadocs shell/static Orama search, `/haptic` base path, sitemap/robots/metadata,
API examples, and the platform capability/certification wording.

## Measurements (`bytes.json`, `measure.mjs`)

| Metric | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Exported CSS (raw / gzip) | 149,878 / 23,528 | 148,539 / 23,642 | −1,339 / +114 |
| Exported JS (raw / gzip) | 1,124,240 / 363,600 | 1,125,248 / 363,743 | +1,008 / +143 |
| Exported fonts | 12,965,628 | 12,965,628 | 0 (no TTF from the tokens tarball is served) |
| Whole static export | 15,679,991 | 15,681,140 | +1,149 |
| Docs source CSS (bytes / lines) | 25,732 / 486 | 17,371 / 225 | −8,361 / −261 |
| Docs direct dependencies | 10 | 12 | +3 HIG, −`lucide-react` |
| Lockfile packages | 556 | 606 | +3 HIG, +48 nested Radix, −1 lucide |

Removed files: `apps/docs/styles/hig/{tokens.css,LICENSE,README.md}`. The JS
increase is the HIG component runtime (Tabs/Switch/Slider/Field/Button/provider hooks).

Known exception (HIG packaging, not shipped): `@bloxwap/hig-react` declares
optional Radix peers pinned to `1.1.15`; Fumadocs already resolves `1.2.0`, so npm
nests 48 Radix packages that the docs never import. `@bloxwap/hig-react/recipes`
also statically imports `overlay` (all four Radix peers), so the docs compose the
CodeWindow recipe from `surface` instead of importing `recipes`.

## Screenshots (`capture.mjs`)

Playwright Chromium (browser, automated), reduced motion, static export served at
`/haptic`. Desktop 1440×900 and mobile 390×844 viewports:
`{before,after}-{home,demo,api,examples}-{desktop,mobile}.png`. `demo` is the
preset board; `examples` is the interaction/forms/drawer demo.

## Checks

`docs:smoke` (Playwright, browser, automated) covers: delayed-hydration gating of
both demos, the preset board with feedback on/off, static search dialog + search
index, keyboard search (⌘/Ctrl+K → arrow → Enter to a deep link) and keyboard
activation/tab order, install tabs keyboard navigation (Arrow/Home/End) and copy
with clipboard readback (Chromium) or announced fallback, mobile sidebar navigation
(Pixel 7 profile), forms/reset, Vaul drawer, HIG callout/control geometry,
reduced motion, and no horizontal overflow. `check-export.mjs` verifies every
route, `/haptic`-prefixed asset link and that no native TTF is exported.

No physical iOS/Android device, simulator/emulator haptics, VoiceOver/TalkBack or
tactile observation is claimed; those remain haptic#9/#7.
