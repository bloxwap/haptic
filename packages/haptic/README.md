<h1 align="center">Haptic</h1>

<p align="center"><strong>Haptic feedback for React.<br>Physical taps on iOS, patterns on vibration-capable browsers.</strong></p>

<p align="center"><a href="https://bloxwap.github.io/haptic/">Documentation and demo</a> · <a href="https://github.com/bloxwap/haptic">Source</a> · <a href="https://github.com/bloxwap/haptic/blob/main/LICENSE">MIT license</a></p>

## Installation

```sh
npm install @bloxwap/haptic
```

React and React DOM are external peers. Use matching React 18+ versions. ESM, CommonJS, and TypeScript declarations are included.

## Usage

```tsx
import { Haptic } from '@bloxwap/haptic';

<Haptic feedback="success">
  <button onClick={save}>Save</button>
</Haptic>
```

Your target keeps its handlers, ref, focus, and accessibility attributes. `HapticTarget` is the same component.

Options: `enabled` (default true), `disabled` (false), `feedback` (`selection`), `triggerOptions`, `webHapticsOptions`, `className`, and `style`. The wrapper uses `inline-grid` by default. Disabled and `aria-disabled="true"` hosts suppress feedback.

Feedback accepts `selection`, `light`, `medium`, `heavy`, `soft`, `rigid`, `success`, `warning`, `error`, `nudge`, `buzz`, a duration in milliseconds, alternating on/off arrays, vibration event objects, or a preset object.

iOS physical taps use a native system tick; presets and intensity do not change it. Synthetic events, timers, and async callbacks cannot promise iOS feedback. Desktop audio preview is opt-in with `webHapticsOptions={{ debug: true }}`. Actual feedback depends on hardware, browser, and settings.

Exports also include `isIOSWebKitWithoutVibration`, `useIOSNativeHaptics`, `HapticTargetProps`, `HapticInput`, `HapticPattern`, `HapticPreset`, `TriggerOptions`, `Vibration`, and `WebHapticsOptions`. The wrapper/platform code is independent; feedback types and the vibration engine use the declared `web-haptics` dependency.

## Documentation

[API, guides, and interactive demos](https://bloxwap.github.io/haptic/). [Source and release evidence](https://github.com/bloxwap/haptic).

## License

MIT
