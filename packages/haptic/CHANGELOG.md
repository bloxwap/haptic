# Changelog

## Unreleased

- Use a local preset table so importing `triggerHaptic` does not bundle the web-haptics engine.
- Create host observers only for native iOS targets and block native overlays until the committed host is enabled.
- **Behavior change:** `useIOSNativeHaptics()` now resolves on the first client-only render (for example `createRoot` mounts and client navigation), so on iOS it returns `true` on the first render instead of after an effect. Server rendering and the first hydration render still return `false`, with iOS routing resolved after hydration.

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
