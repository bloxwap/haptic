# Changelog

## Unreleased

- Preserve original events by default. The iOS switch overlay now requires `iosPhysicalTap`; unsupported hosts remain unobstructed. The opt-in's pointer interception, synthetic click and ancestor capture differences are documented.
- Correct adjacent vibration/silence encoding and bound input size, expansion and total duration. Own component vibration cancellation across all package entries and prevent preview work after disposal.
- Restore native backend scopes safely in any order, isolate pending work across backend changes, contain initialization/thenable failures and expire hung calls after one second without replay.
- Share the enable gate across module formats and queue reentrant settings notifications. Cancellation bypasses playback eligibility; adapter disposal releases resources without waiting for cancellation and is terminal.
- Validate exact documentation snippets, registry metadata from the expected manifest, release build inputs, and real Expo/React Native packed consumers. Record benchmark worktree and artifact fingerprints. Clarify the demo's custom-pattern intensity control.
- Resolve the root and explicit native entry to the same Metro module so they share backend state. The native bundle budget is now 1,280 gzip bytes (measured 1,121) to accommodate the lifetime safeguards.
- Update the docs site's Next.js dependency to 16.4.6 to clear the security advisory reported during build verification.

- **New:** cross-platform `haptics` object (`selection`, `light`, `medium`, `heavy`, `success`, `warning`, `error`) plus `useHaptics`, `setHapticsEnabled`, `hapticsEnabled`, and `subscribeHapticsEnabled`, exported from both entries.
- **New:** React Native entry backed by `expo-haptics`, at `@bloxwap/haptic/native` and through the `react-native` condition on `@bloxwap/haptic`. Android uses `HapticFeedbackConstants`. Per-cue lanes keep one native call in flight and collapse bursts into a single trailing replay. This replaces the monorepo's `ui-native` lane scheduler and `apps/mobile` backend.
- **Peer dependency change:** `expo-haptics` (>=14) and `react-native` are new optional peers. `react-dom` is now optional, because nothing imports it at runtime and React Native apps should not install it.
- Web `haptics.*` skips the engine and calls `navigator.vibrate` with cached preset arrays. `npm run bench:api` measured 4–7 ns per tap, against 132–144 ns for a `WebHaptics` singleton (jsdom, M3 Max). On a busy native lane, a tap costs 3–4 ns against 9–15 ns for the `ui-native` scheduler.

## 0.4.0 — 2026-11-11

Invariant release for issues #57–#67 (pull requests #68–#72). Verification for this release is jsdom and CI only. No physical-device results were recorded.

- **Behavior change:** a target whose child renders more than one DOM node (a fragment, a component returning siblings, or text beside the element) now fails closed. It adds no iOS overlay and requests no vibration, so a tap can no longer run the first element's action instead of the one tapped (#57). Development builds log a `console.error`.
- **Behavior change:** nested targets defer to the innermost target. On iOS the outer target adds no overlay, so the inner action runs exactly once; on vibration browsers a tap inside the inner target requests feedback once, with the inner props (#60). Development builds log a `console.error`.
- The target wrapper now carries a `data-haptic-target` attribute, which appears in server-rendered markup.
- **Peer dependency change:** `react` and `react-dom` are `^18.0.0 || ^19.0.0` instead of `>=18`. The component suite runs on React 18.3.1 and 19.3.0 in CI, and a peer range that admits another major fails the check (#66).
- **Behavior change:** a Vibration API installed after the bundle evaluates now vibrates on tap. `web-haptics` freezes support at import, so that tap previously appended a hidden switch label and never called `navigator.vibrate` (#58). Debug audio and the visible switch still use the engine's DOM path, and unmount removes that DOM and stops its animation-frame loop.
- The native adapter maps every `SemanticHaptic` cue (#67). Published `"use client"`, per-entry bundle budgets, tsrs/tsc parity, lockfile agreement, and the docs workspace dependency are now enforced (#59, #61–#64). `/feedback` is typechecked against `@bloxwap/hig` 0.2.0 (#65). That HIG release's optional peer range still ends at `^0.3.0`.

Physical-device and VoiceOver certification remains pending in issue #9; automated checks do not establish tactile output.

## 0.3.0 — 2026-10-20

Performance release driven by the `npm run bench` suite (#35). Benchmark numbers are simulated-browser measurements, not physical-device results.

- Use a local preset table so importing `triggerHaptic` does not bundle the web-haptics engine.
- Create host observers only for native iOS targets and block native overlays until the committed host is enabled.
- **Behavior change:** `useIOSNativeHaptics()` now resolves on the first client-only render (for example `createRoot` mounts and client navigation), so on iOS it returns `true` on the first render instead of after an effect. Server rendering and the first hydration render still return `false`, with iOS routing resolved after hydration.
- Skip the `web-haptics` engine, its hidden DOM, and its animation-frame loop on desktop browsers without vibration unless debug audio or the visible switch is enabled.

Physical-device and VoiceOver certification remains pending in issue #9; automated checks do not establish tactile output.

## 0.2.0 — 2026-10-19

- Add `canTriggerHaptic` and `triggerHaptic` for browser vibration with explicit request results, SSR safety, and no auxiliary DOM. Imperative iOS ticks remain unavailable because transient activation does not establish a trusted switch event.
- Add the platform-free `@bloxwap/haptic/feedback` entry and optional host-injected native bridge.
- Add host-owned haptic preferences and application policy to physical targets.
- Migrate docs to pinned HIG tokens with reduced-motion alternatives and drift checks.

Physical-device and VoiceOver certification remains pending in issue #9; automated checks do not establish tactile output.

## 0.1.0 — 2026-10-10

- Independently implemented Haptic/HapticTarget wrapper, platform helper, and hydration-safe hook.
- Existing props, aliases, public types, eleven presets, and custom inputs retained through web-haptics 0.0.6.
- Original host handlers, refs, focus, keyboard behavior, link/form defaults, and accessibility retained.
- Native iOS routing, disabled/ARIA state observation, drawer handling, and gesture cancellation.
- ESM, CommonJS, and declarations, with React as an external peer.
- Separate Bloxwap docs/demo workspace and independently authored verification.

Initial stable release. Physical-device and VoiceOver certification remains pending in issue #9; automated checks do not establish tactile output.

## 0.1.0-rc.0 — 2026-10-10

- Bootstrap prerelease of the same implementation to establish npm package settings before the stable trusted-publisher release.
