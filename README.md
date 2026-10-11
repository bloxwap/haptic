<h1 align="center">Haptic</h1>

<p align="center"><strong>Haptic feedback for React on iOS and vibration-capable browsers.<br>One target. Same handlers, ref, focus, and accessibility.</strong></p>

<p align="center">
  <a href="https://github.com/bloxwap/haptic/issues/1">Release plan</a> ·
  <a href="https://bloxwap.github.io/haptic/">Documentation and demo</a> ·
  <a href="LICENSE">MIT license</a>
</p>

<p align="center">
  <a href="https://github.com/bloxwap/haptic/actions/workflows/tests.yml"><img src="https://github.com/bloxwap/haptic/actions/workflows/tests.yml/badge.svg" alt="Tests"></a>
  <a href="https://github.com/bloxwap/haptic/actions/workflows/docs.yml"><img src="https://github.com/bloxwap/haptic/actions/workflows/docs.yml/badge.svg" alt="Documentation"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"></a>
</p>

## Features

- `Haptic` and `HapticTarget`: aliases for one component wrapping the original React target.
- Eleven vibration presets and custom durations, alternating patterns, and event objects with delay/intensity.
- Native iOS physical-tap ticks, plus patterns on browsers with the Vibration API.
- Handlers, refs, focus, accessibility, keyboard, forms, links, and drawer integration retain target behavior.
- Server-safe rendering and hydration, ESM and CommonJS, and TypeScript declarations.
- Independently written wrapper/platform code with `web-haptics` as a declared dependency.

Initial version: **0.1.0**. Physical-device and VoiceOver certification remains pending in [issue #9](https://github.com/bloxwap/haptic/issues/9). Automated checks establish browser interactions and API calls, not tactile output. See the [release evidence](https://github.com/bloxwap/haptic/issues/14).

## Installation

```sh
npm install @bloxwap/haptic
```

Use matching React and React DOM peer versions, React 18 or newer.

## Usage

```tsx
import { Haptic } from '@bloxwap/haptic';

export function SaveButton() {
  return (
    <Haptic feedback="success">
      <button onClick={() => console.log('Saved')}>Save</button>
    </Haptic>
  );
}
```

The original element keeps its handlers, ref, focus, and accessibility. The wrapper defaults to `inline-grid`; `className` and `style` control its layout.

```tsx
<Haptic
  feedback={[30, 60, 30]}
  triggerOptions={{ intensity: 0.7 }}
  webHapticsOptions={{ debug: false, showSwitch: false }}
  style={{ display: 'grid', width: '100%' }}
>
  <button>Continue</button>
</Haptic>
```

`enabled={false}` or `disabled={true}` suppresses feedback while leaving the action available. Disabled and `aria-disabled="true"` hosts are detected automatically.

## API

Exports: `Haptic`, `HapticTarget`, `HapticTargetProps`, `isIOSWebKitWithoutVibration`, `useIOSNativeHaptics`, and the public types `HapticInput`, `HapticPattern`, `HapticPreset`, `TriggerOptions`, `Vibration`, `WebHapticsOptions`.

Presets: `selection`, `light`, `medium`, `heavy`, `soft`, `rigid`, `success`, `warning`, `error`, `nudge`, `buzz`.

`feedback` accepts a preset string, duration in milliseconds, alternating on/off `number[]`, vibration event objects, or `{ pattern: [...] }`. The default is `selection`.

## Platforms

iOS feedback requires a physical tap and always uses the native system tick. Timers, synthetic clicks, and asynchronous callbacks cannot promise physical feedback. Presets and intensity apply to vibration-capable browsers.

Desktop audio preview is opt-in with `webHapticsOptions={{ debug: true }}`. Hardware and browser settings determine actual feedback; iPadOS routing alone does not prove haptic hardware. Browser automation does not establish tactile output.

For Next.js, place interactive usage in a client component. The build preserves its client boundary and renders safely through React SSR.

## Documentation

[Guides, API, and interactive demos](https://bloxwap.github.io/haptic/). The [evaluation](.github/planning/EVALUATION.md), [compatibility contract](.github/planning/COMPATIBILITY.md), and [task index](.github/planning/TASKS.md) record the independent build and release requirements.

## Development

The private npm workspace separates the publishable library in `packages/haptic` from the documentation/demo app in `apps/docs`.

```sh
npm ci
npm run build
npm run typecheck
npm run test
npm run coverage
npm run test:matrix
npm run size
npm run pack:check
npm run test:browser
npm run dev           # docs at http://localhost:3904
```

Use Node 24 or newer for development. `bun run dev` invokes the same script; npm owns the lockfile.

```sh
NEXT_PUBLIC_BASE_PATH=/haptic npm run docs:build
npm run docs:check
npm run docs:preview
```

## License

MIT. `web-haptics` is independently distributed under MIT; website fonts retain their [OFL license notice](apps/docs/public/licenses/bloxwap-font-OFL.txt), which is included in the static site.
