# Haptic: evaluation and initial release plan

Evaluated on October 10, 2026. This is the specification and task plan for an independently implemented `@bloxwap/haptic`, preserving the current public behavior of `@joeblau/haptic`.

## Current state

- The starting local directory was empty. A new public [bloxwap/haptic](https://github.com/bloxwap/haptic) repository now holds this assessment and its task backlog.
- Upstream is version `0.1.0`, MIT licensed, at commit [`87cb02a`](https://github.com/joeblau/haptic/tree/87cb02a702b862f5c79a976b4de17453d93ef866).
- Upstream combines the library in `src/`, a Vite React demo in `demo/`, tests alongside source, and build tooling in one package. It declares `web-haptics ^0.0.6` as its runtime dependency and React and React DOM `>=18` as peers. Its lockfile resolves `web-haptics` to `0.0.6`.
- Its manifest provides ESM, CommonJS, TypeScript declarations, and an allowlist containing `dist`, README, and LICENSE. Installation currently uses a GitHub dependency in the README.
- Registry requests for both `@joeblau/haptic` and `@bloxwap/haptic` returned HTTP 404. This establishes that neither package was publicly retrievable at evaluation time; it does not prove publishing permissions or reserve the new name.
- The upstream homepage, `https://fathom-mocha.vercel.app`, returned HTTP 404. Live demo behavior and physical feedback could not be assessed there.

## Evidence and clean-room boundary

The assessment uses upstream README and package metadata, public export/type declarations, behavioral assertions in the published test files, dependency documentation and distributed declarations, and platform specifications. Upstream algorithm bodies were excluded from the evaluation output and are not included in this repository. Existing tests describe behavior; new tests must be independently authored rather than copied.

Implementation must use this contract and observable outcomes. Do not copy or translate upstream runtime source, internal markup, styles, tests, or demo code. Snapshot provenance and uncertainties in the compatibility task before implementation begins. This is an engineering independence boundary, not a claim that a formal two-team process has already occurred.

Sources at the pinned upstream revision:

- [README](https://github.com/joeblau/haptic/blob/87cb02a702b862f5c79a976b4de17453d93ef866/README.md), [manifest](https://github.com/joeblau/haptic/blob/87cb02a702b862f5c79a976b4de17453d93ef866/package.json), [lockfile](https://github.com/joeblau/haptic/blob/87cb02a702b862f5c79a976b4de17453d93ef866/package-lock.json), and [public export declarations](https://github.com/joeblau/haptic/blob/87cb02a702b862f5c79a976b4de17453d93ef866/src/index.ts).
- [React behavior tests](https://github.com/joeblau/haptic/blob/87cb02a702b862f5c79a976b4de17453d93ef866/src/HapticTarget.test.tsx) and [platform behavior tests](https://github.com/joeblau/haptic/blob/87cb02a702b862f5c79a976b4de17453d93ef866/src/platform.test.ts).
- Public props and function signatures were isolated from their source declarations; algorithm bodies were not retained. Only signatures are compatibility requirements.
- [web-haptics documentation](https://github.com/lochie/web-haptics) and the distributed `0.0.6` TypeScript declarations retrieved from the npm registry.
- [WebKit switch control documentation](https://webkit.org/blog/15054/an-html-switch-control/) and the [W3C Vibration API specification](https://www.w3.org/TR/vibration/).

## Public API to preserve

| Export | Contract |
| --- | --- |
| `Haptic`, `HapticTarget` | Two names for the same React component. Wrap one physical tap target while preserving its handlers, ref, focus behavior, and accessibility attributes. |
| `HapticTargetProps` | Public component props listed below. |
| `isIOSWebKitWithoutVibration(navigatorLike?)` | Returns a boolean. Defaults to the browser navigator when present, accepts an explicitly supplied Navigator, and is safe without browser globals. |
| `useIOSNativeHaptics()` | Returns a boolean; preserve server/initial-render safety and resolve client platform behavior after mounting. |
| `HapticInput`, `HapticPattern`, `HapticPreset`, `TriggerOptions`, `Vibration`, `WebHapticsOptions` | Public types currently re-exported from the dependency. |

| Prop | Type or behavior | Default |
| --- | --- | --- |
| `children` | One React element whose host can receive a click; preserve the original target. Custom components and invalid-child cases need characterization. | Required |
| `enabled` | Enables feedback without replacing the action's normal behavior. | `true` |
| `disabled` | Explicitly suppresses feedback. Also detect a disabled host automatically. | `false` |
| `feedback` | `HapticInput`; selects the vibration feedback. The iOS native path always produces the platform system tick. | `selection` |
| `triggerOptions` | Dependency trigger options, currently `intensity?: number`. | Optional |
| `webHapticsOptions` | Dependency construction options, currently `debug?: boolean` and `showSwitch?: boolean`. | Optional |
| `className` | Positioning wrapper class. | Optional |
| `style` | React CSS properties overriding wrapper layout. | Wrapper defaults to `inline-grid` |

Feedback input accepts a preset string, one duration in milliseconds, alternating on/off `number[]`, `Vibration[]`, or `{ pattern: Vibration[] }`. Each vibration has `duration`, optional `delay`, and optional `intensity`. Preserve these types without introducing extra required fields.

The dependency's distributed `0.0.6` declarations expose **11 presets**: `success`, `warning`, `error`, `light`, `medium`, `heavy`, `soft`, `rigid`, `selection`, `nudge`, and `buzz`. Its README lists only four and its illustrated timings differ from the distributed declarations. Freeze the resolved dependency and characterize actual output before promising exact timing. Retaining that dependency preserves its catalog without independently copying recipes.

## Behavior and platform parity

| Area | Evidence-backed requirement | Verification still needed |
| --- | --- | --- |
| Non-iOS click | A completed click invokes the host action once and requests the selected feedback with its options. | All input forms, option changes, keyboard activation, disabled variants, unsupported devices, and errors. |
| iOS physical interaction | The documented native path requires a physical tap. Timers, asynchronous callbacks, and synthetic events cannot promise physical iOS feedback. | Actual hardware tick, supported OS/browser versions, and device settings. |
| Host preservation | Tests assert one host action, one bubbled parent action, original ref identity, and focus of the original button after an iOS tap action. | Links/navigation, submit/reset, `preventDefault`, propagation, nested content, and custom components. |
| Drag and scroll | A pointer sequence without a completed click must not invoke the action. | Real scrolling, cancellation, moving outside the target, touch selection, and layout changes. |
| Drawer integration | A test asserts protection from ancestor pointer-down handling inside a Vaul drawer. | Actual drawer integration and ordinary ancestor event behavior. |
| Disabled feedback | `enabled=false`, `disabled=true`, and a disabled host suppress the iOS feedback target. | `aria-disabled`, runtime prop changes, and retaining normal host semantics where only haptics are disabled. |
| Platform routing | Tests recognize iPhone WebKit and touch-capable iPadOS desktop-mode identities, reject non-WebKit identities, and prefer the Vibration API if it exists. | Physical hardware support is separate from routing; iPad recognition does not establish haptic hardware. |
| SSR/hydration | Tests render without browser-only feedback controls on the server. The platform helper safely accepts no navigator. | Actual hydration, React 18/19, Strict Mode, multiple instances, and client bundle boundaries. |
| Accessibility | Preserve host attributes and focus. Auxiliary iOS feedback controls are hidden from assistive technology and are not additional tab stops. | VoiceOver, keyboard navigation, focus restoration, form behavior, and accessibility scans. |
| Lifecycle | Dependency exposes destruction and resource cleanup. | Observe the wrapper's unmount/reconfiguration behavior, then verify no leaked DOM, listeners, timers, or audio resources. |

The upstream test files contain 14 cases using a mocked feedback engine and synthetic DOM events. These assertions help define parity, but they do not establish tactile output, browser compatibility, or successful physical activation.

WebKit documents the native switch control from Safari 17.4. That establishes a control baseline, not universal haptic support. Vibration availability and a successful API call likewise do not prove that a device physically vibrated. Automated browser checks must be paired with recorded physical-device results before release claims are made.

## Bloxwap conventions

| Reference | Pinned revision | Structure and relevant conventions |
| --- | --- | --- |
| [SFX](https://github.com/bloxwap/sfx/tree/0b0d21180080ae113f4154332d7daf3bb75d0e6f) | `0b0d211` | Private npm workspace, `packages/sfx`, `apps/docs`, package-local tests/scripts, root task forwarding, package-only npm publishing, GitHub Pages, release-triggered OIDC publishing. Closest model for this library. |
| [Chart](https://github.com/bloxwap/chart/tree/0bd528c67b0f9ddb5a320fe70e926fdb5dfbda4f) | `0bd528c` | Private npm workspace, `packages/chart`, `apps/docs`, optional separate playground, package-local build/test tooling, GitHub Pages and npm release workflows. |
| [Hyperliquid](https://github.com/bloxwap/hyperliquid/tree/117f2b5d19c9516f6017516b92a53bfcc950d33d) | `117f2b5` | Private workspace, `packages/hyperliquid`, `apps/docs`, Bun task forwarding, scoped package exports, release publishing. It retains runtime dependencies, so zero dependencies is not an organization-wide invariant. |
| [Font](https://github.com/bloxwap/font/tree/b40639162786f394b23da19a8c81d7fa2cb5f51e) | `b406391` | Private workspace, font tools/package distribution separated from `apps/docs`, short README, interactive documentation, Pages and npm workflows. Its font-specific package split is unnecessary for haptic. |

All four README files use a centered title, a brief bold description with a demo/docs link, and a compact badge row. They then provide installation/usage or quick examples, documentation, development/workspace guidance, and licensing at a length suited to the project. The documentation apps use Next.js and Fumadocs; SFX, Chart, and Hyperliquid consume `@bloxwap/font` for consistent branding.

## Recommended repository and package design

```text
haptic/
  .github/
    planning/             # evaluation and backlog
    workflows/            # verification, Pages, npm publication
  apps/
    docs/                 # private Next.js/Fumadocs app and interactive demos
  packages/
    haptic/
      src/
        index.ts          # public entry points and types
        haptic.tsx        # target interaction and React wrapper
        platform.ts       # routing and hydration-safe platform hook
      test/               # independently written behavioral/integration tests
      scripts/            # package/size verification when needed
      package.json
      README.md
      LICENSE
      CHANGELOG.md
  package.json            # private workspace and task forwarding
  package-lock.json       # one authoritative npm lockfile
  README.md
  LICENSE
```

This is a proposed minimal module boundary; add a file only when a distinct concern justifies it. The docs app imports the workspace package through its public name. It must not depend on private implementation paths or carry a second haptic engine. There is no need for a second playground app for this small library.

Initial implementation decisions:

1. Publish `@bloxwap/haptic` from `packages/haptic`; the workspace and documentation app remain private.
2. Independently implement the upstream React wrapper and platform behavior while retaining declared `web-haptics` dependency behavior. Pin its resolved version for the first release. Replacing that third-party engine is not required by a clean-room rebuild of the wrapper and would need an expanded specification.
3. Preserve the upstream root exports and **both ESM and CommonJS** entry points with declarations. SFX and Chart's ESM-only manifests should not silently remove an existing haptic consumption mode.
4. Keep React and React DOM external peers; verify React 18 and 19 rather than inferring support solely from a wide peer range. Keep Next.js/Fumadocs, fonts, and other site dependencies confined to `apps/docs`.
5. Use a private npm workspace with one lockfile and root forwarding commands. Support a Bun development alias only if it works with that same installation/lockfile policy.
6. Adapt the Bloxwap README and docs presentation with original prose and examples. Until release, state project status clearly and avoid badges or support claims implying checks that have not occurred.

## Release work and completion evidence

The GitHub backlog covers compatibility specification, workspace setup, platform helpers, the React wrapper, iOS feedback, vibration/dependency integration, regression tests, device certification, documentation, distribution validation, CI/Pages, npm publishing preparation, and the first verified release. Each task specifies dependencies and acceptance evidence.

The first stable release is complete only when:

- Every public export, prop, feedback input, and characterized behavior has independently written compatibility evidence.
- ESM and CommonJS consumers and TypeScript fixtures install the packed artifact without access to workspace source. SSR and hydration work on the supported React versions.
- Recorded physical-device tests substantiate the exact iOS/Android claims; unsupported hardware safely preserves the original action.
- The branded docs site builds, deploys to `https://bloxwap.github.io/haptic/`, and passes smoke checks under the `/haptic/` base path.
- The npm tarball contains the intended builds, declarations, manifest, README, license, and changelog while excluding the website and development-only content.
- npm scope access and first-publication setup are verified. `@bloxwap/haptic` is installable from the public registry at the release version, its dist-tag is correct, and the provenance links to the release source.
- Subsequent publication uses the configured GitHub OIDC publisher, with the exact owner/repository/workflow and allowed publish action verified. Do not assume a workflow creates the npm-side trust relationship.

[npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) currently requires npm CLI 11.5.1+ and Node 22.14.0+ on supported hosted runners. Configure `id-token: write`, the exact workflow filename, and allowed actions; newer configurations may default to staged publication. Account setup and publication of a new name need an explicit bootstrap path. Consult the current documentation when executing the release, including [scoped public package publication](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), rather than copying a sibling workflow unchanged.

## Limits of this assessment

No upstream runtime suite, packed consumer test, or physical-device haptic test was executed during evaluation. No library implementation or npm package has been published. Undocumented edge cases, exact dependency runtime patterns, supported OS versions, npm account permissions, and real-device output remain work items rather than completed claims.
