# Haptic HIG adoption evidence · 2026-10-13

Owner: haptic maintainers. HIG version: 0.1.0 candidate at
1a776b9326c6ba03702894943b3edbfd178c4b40. Baseline haptic:
e95a29e67365c0101b23bc83e9a7a547c2c0bb0e. Owning PR: https://github.com/bloxwap/haptic/pull/25. Rollback: revert the owning PR; restore prior shell CSS,
font and imports. No SDK demo/business logic or preference storage is replaced.

## Docs row (#34, #36)

Fumadocs remains the host shell, as allowed by the migration kit. Shared palette
comes from the approved pinned plain CSS distribution. Bloxwap Sans/Mono remain
package imports; the independent Space Grotesk display font is removed. Local CSS
contains only compatibility aliases, geometry and demo-specific presentation.
The token checksum check guards the unpublished-package exception. Revisit that
exception by 2026-11-13 with haptic maintainers when HIG is registry available.

`before-home.png`, `after-home.png`, `before-api.png`, `after-api.png` are Linux
Chromium 1280×900 full-page captures. Both static exports use /haptic. Compared
home/install/board/footer and API/nav/code presentation; production smoke tests
verify responsive/mobile navigation, search, deep links, actions and drawer/forms.
`bytes.json` records the actual measurement boundary, including baseline reuse of
the current SDK workspace binary. Unique exported CSS decreases 2,886 bytes,
font assets decrease 116,056 bytes; exported JS increases 136 bytes with live-mute cleanup. Source token
CSS decreases from 6,064 bytes to 2,521 bytes (HIG distribution plus bridge).
No runtime dependency is added; the published browser entry is 3,840 gzip bytes
against the existing 8,192-byte budget. This is not a per-page transfer estimate.

## Feedback row (#21–#25, #33, #35)

The /feedback entry imports no platform package and compiles with ES2020-only
libs in packed React 18/19 consumers. Structural HIG events/preferences and mapping
match the pinned HIG contract. The Expo bridge is injected and has no installed
Expo/RN dependency. Application policy and host haptic preferences gate targets;
motion and sound stay independent. HIG owns persistence/migrations, nested-control
semantics, deduplication, cooldowns and host feedback composition. Existing raw
HapticTarget capture feedback occurs before delegated handler cancellation;
accepted-event browser integration must use the HIG adapter, with the target
wrapper enabled only for pre-approved physical iOS targets.

79 unit tests pass with 100% lines/functions/branches/statements, including every
semantic cue, silent phases, impacts, gates, background/disposal, failure isolation
and independent preferences. React 18.3.1 / 19.3.0 and packed ESM/CJS consumers pass.
Nine docs snippets typecheck; docs export and 16 browser smoke tests pass across
Chromium, Firefox, WebKit and mobile Chromium. Reduced-motion tests preserve the
enabled haptic action. Package browser interaction tests pass for actions/routing
in all three engines. Local Firefox debug audio initially stayed suspended without
an audio output; after extracting PulseAudio locally and using a null sink, its
real WebAudio startup/teardown test passed. Shared VM load required a 120s test
budget on the isolated retry. CI uses its existing PulseAudio null sink; see PR CI
for final full browser results under the standard test budget. A null sink is audio pipeline testing, not audible or tactile
hardware evidence.

## Precise remaining ownership and limitations

- #21: HIG owns provider/handler ordering and full component contract adoption.
- #22: HIG/product owners must integrate button/switch/slider/menu/outcomes and SFX;
  actual iOS/Android/settings/VoiceOver observations remain haptic#9 and #7.
- #23: SFX/native hosts own WAV provenance, playback assets and device audio evidence;
  haptic adds no audio pipeline and is not a dependency of it.
- #24: native hosts must wire AppState/preferences and exercise the bridge on real
  iPhone/Android. Expo has no cancellation API for an already submitted tick.
- #25: HIG owns versioned controller cadence, stored sound/volume/haptic settings,
  migration/storage adapters and composition previews. This SDK adds no competing store.
- #33: app/Pro/marketing owning repos must migrate and supply build/visual/interaction,
  feedback-state and rollback evidence. No product code is modified here.
- #34: Haptic's docs row is migrated/automated; four other SDK rows remain their
  owners' responsibility. Physical demo certification and tactile observations are
  still pending, separately from the working automated distinctive demos.
- #35: owning native app must integrate and build iOS/Android, exercise large text,
  RTL, VoiceOver/TalkBack, safe areas/back/gestures and measure native size/latency.
- #36: HIG owners must update the organization matrix and complete governance/catalog
  review; this repo supplies a scoped drift guard and a dated distribution exception.

No complete HIG issue is certified by this repository alone. Linux browser routes,
UA emulation and mocked Expo calls are not physical device observations. No physical
iOS/iPadOS/Android, accessibility device session or tactile latency is fabricated.
