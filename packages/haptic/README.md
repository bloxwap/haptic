<h1 align="center">Haptic</h1>

<p align="center"><strong>Haptic feedback for React and React Native.<br>Physical taps on iOS web, patterns on vibration-capable browsers, expo-haptics on iOS and Android apps.</strong></p>

<p align="center"><a href="https://bloxwap.github.io/haptic/">Documentation and demo</a> · <a href="https://github.com/bloxwap/haptic">Source</a> · <a href="https://github.com/bloxwap/haptic/blob/main/LICENSE">MIT license</a></p>

## Installation

```sh
npm install @bloxwap/haptic
```

React and React DOM are external peers. Use matching React 18 or 19 versions. ESM, CommonJS, and TypeScript declarations are included.

## Usage

By default, `Haptic` preserves the original pointer and click events. On iOS WebKit without vibration it stays silent. Set `iosPhysicalTap` to opt into the native switch overlay on a button or link that has no nested controls. That overlay intercepts pointer handlers, forwards an untrusted click without the original modifiers, coordinates or click count, and exposes auxiliary clicks to ancestor capture handlers. Keep it off for gesture controls, modified links, or capture-based actions. Unsupported hosts keep their original interaction without an overlay.

```tsx
import { Haptic } from '@bloxwap/haptic';

<Haptic feedback="success">
  <button onClick={save}>Save</button>
</Haptic>
```

Your target keeps its handlers, ref, focus, and accessibility attributes. `HapticTarget` is the same component.

Options: `iosPhysicalTap` (default false), `enabled` (default true), `disabled` (false), `feedback` (`selection`), `triggerOptions`, `webHapticsOptions`, `className`, and `style`. The wrapper uses `inline-grid` by default. Disabled and `aria-disabled="true"` hosts suppress feedback.

Feedback accepts `selection`, `light`, `medium`, `heavy`, `soft`, `rigid`, `success`, `warning`, `error`, `nudge`, `buzz`, a duration in milliseconds, alternating on/off arrays, vibration event objects, or a preset object.

Opted-in iOS physical taps use a native system tick; presets and intensity do not change it. Synthetic events, timers, and async callbacks cannot promise iOS feedback. Desktop audio preview is opt-in with `webHapticsOptions={{ debug: true }}`. Actual feedback depends on hardware, browser, and settings.

Physical-device and VoiceOver certification remains pending in [issue #9](https://github.com/bloxwap/haptic/issues/9). Automated tests verify browser interactions and API calls, not tactile output.

Exports also include `isIOSWebKitWithoutVibration`, `useIOSNativeHaptics`, `canTriggerHaptic`, `triggerHaptic`, `HapticTargetProps`, `HapticCapability`, `HapticTriggerResult`, `HapticInput`, `HapticPattern`, `HapticPreset`, `TriggerOptions`, `Vibration`, and `WebHapticsOptions`. The wrapper/platform code is independent; feedback types and preset definitions remain compatible with the declared `web-haptics` dependency. Encoding, vibration ownership and preview lifecycle are implemented locally.

`useIOSNativeHaptics()` returns the detected routing value on the first client-only render. It returns `false` on the server and during the first hydration render, then resolves client routing after hydration.

`canTriggerHaptic()` probes current imperative availability without creating DOM. `triggerHaptic(cue?, options?)` requests browser vibration with the same patterns and resolves `{ delivered, mechanism, reason? }` without rejecting or creating auxiliary DOM. `delivered` means browser acceptance, not observed tactile output. iOS imperative feedback reports unavailable even during transient activation: programmatic switch clicks do not establish a trusted physical tap. Use `<HapticTarget iosPhysicalTap>` for the eligible iOS physical path after reviewing the overlay limitations above.

## Cross-platform `haptics`

One import for web and native. React Native bundlers resolve `@bloxwap/haptic` to the native entry through the `react-native` export condition; browsers get the web entry.

```tsx
import { haptics, setHapticsEnabled } from '@bloxwap/haptic';

haptics.selection(); // also light, medium, heavy, success, warning, error
setHapticsEnabled(storedPreference); // gate shared across entries and module formats in the same JavaScript realm; persistence is yours
```

`useHaptics()` returns the same stable object and never re-renders. `hapticsEnabled()` and `subscribeHapticsEnabled(listener)` read and observe the gate.

- **Web:** calls `navigator.vibrate` directly with precompiled preset patterns: no DOM, engine instance, or animation frames. It is silent on iOS WebKit (explicitly opt into `Haptic`'s physical overlay there) and before the first user gesture.
- **iOS app:** `expo-haptics` `selectionAsync`, `impactAsync`, and `notificationAsync`.
- **Android app:** `performAndroidHapticsAsync` with `HapticFeedbackConstants` (`Segment_Tick`, `Virtual_Key`, `Context_Click`, `Long_Press`, `Confirm`, `Reject`). Without them (`expo-haptics` older than 14), it falls back to the iOS-style calls.

Native installs need the optional peer: `npx expo install expo-haptics`. Each cue owns a lane with at most one tracked native call in flight. Calls that do not settle within one second expire without replay; this releases tracking and cannot retract work already sent to the OS. Taps that arrive while it is busy collapse into one trailing replay, so a burst never queues bridge calls. `installHapticBackend(backend | null)` swaps the physical backend for tests or a custom engine and returns an idempotent restore function. Scopes may be restored out of order; retired backends are never reinstated. Changing the active backend drops pending replays. `createExpoHapticBackend(module, os?)` builds the default one. `@bloxwap/haptic/native` is the explicit native entry.

## Pattern and lifecycle limits

Input is bounded to 64 events (128 alternating numeric entries), 1,024 encoded segments, and 10 seconds including delays. Each event's vibration is capped at 1,000 ms; fractional milliseconds are rounded down. Invalid or oversized input is silent. Browsers may impose tighter limits. Explicit event intensities, including those in named presets, take precedence over `triggerOptions.intensity`.

Component cleanup cancels only the vibration it most recently requested, provided another package API has not taken ownership. Direct calls to `navigator.vibrate` outside this package cannot participate in that ownership tracking. Canceling or disposing a preview invalidates pending audio initialization. Adapter disposal starts cancellation but does not wait for it before releasing the backend, and disposed adapters ignore all later operations.

## Documentation

[API, guides, and interactive demos](https://bloxwap.github.io/haptic/). [Source and release evidence](https://github.com/bloxwap/haptic).

## License

MIT

### HIG semantic feedback

`@bloxwap/haptic/feedback` exports platform-free `FeedbackEvent`,
`FeedbackPreferences`, `semanticHaptics`, `createHapticAdapter(backend)` and
`createNativeHapticAdapter(hostExpoModule, capability)`. The adapters implement
HIG's haptic channel without importing React, DOM, Web Audio, Expo or RN. HIG owns
preference storage, event deduplication and cadence; the host supplies backend
availability and AppState. API success is never hardware observation.

`HapticTarget` also accepts host `preferences={{ haptics }}` and
`policyEnabled`. Application veto and stored preferences gate component intent;
sound and motion remain independent. For HIG's physical iOS target, opt in with `iosPhysicalTap`, pre-approve
eligibility, enable only the physical path and disable debug audio. An iOS tick
cannot be canceled after the OS activates its switch. Native Expo operations
cannot retract an already submitted tick either.

See the [integration guide](https://bloxwap.github.io/haptic/docs/hig/) for mappings,
backend injection, no-op defaults, independent channels and validation limits.
