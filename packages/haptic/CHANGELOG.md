# Changelog

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

## Unreleased

- Add the platform-free HIG semantic feedback entry and optional host-injected native bridge.
- Add host-owned haptic preferences and application policy to physical targets.
- Migrate docs to pinned HIG tokens with reduced-motion alternatives and drift checks.
