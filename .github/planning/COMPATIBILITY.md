# Compatibility contract

Reference: `@joeblau/haptic` 0.1.0 at `87cb02a702b862f5c79a976b4de17453d93ef866`, with the lockfile's `web-haptics` 0.0.6. [Evaluation and source provenance](EVALUATION.md).

The reference was installed and built in `/tmp/haptic-reference-87cb02a`; its algorithms were not inspected or ported. An independently written consumer exercised the distributed build. [Recorded observations](reference-observations.json) contain public outcomes and actual calls to the Vibration API, not copied pattern recipes. The new implementation delegates those recipes to the pinned dependency.

## Requirements and evidence

| Requirement | Reference evidence | New implementation / verification |
| --- | --- | --- |
| Four runtime exports and component alias identity | Public exports and measured `alias=true` | `src/index.ts`, alias assertion in `test/haptic.test.tsx`, installed ESM/CJS export checks |
| `HapticTargetProps` and six feedback/options types | Isolated declarations and dependency's distributed declarations | Source public interface/re-exports; all-type JSX/NodeNext ESM/CJS fixtures in `scripts/pack-check.mjs` |
| All eight props, default enablement, selection feedback, inline-grid layout | Public declarations and default/disabled measurements | Independent prop/input tests, wrapper layout assertion, typed consumer fixtures |
| Eleven presets | Dependency declarations and actual measured API arrays for every preset | `test/dependency.test.ts` compares retained engine output with observations; wrapper preset forwarding tests |
| Duration, numeric pattern, event pattern, preset object | Four measured custom-input cases | Wrapper forwarding tests; declaration fixtures; pattern documentation |
| Intensity/debug/showSwitch | Public option declarations and dependency API | Exact argument forwarding assertions, construction-option update and cleanup tests |
| Original host handlers, ref, ARIA, focus | README, upstream behavior assertions, measured ref/action/focus outcomes | Original child rendered unchanged; unit and browser checks for ref/ARIA/action/focus |
| Feedback before the target's React handler | Measured `sequence=['feedback','action']` | Native capture listener; independent sequence tests |
| `preventDefault` and `stopPropagation` | Measured feedback retained; parent outcomes preserved | Unit cancellation tests and real-browser prevented-submit checks |
| Feedback disabling and disabled/ARIA hosts | Recorded prop and host cases, both ARIA representations | Prop/ARIA/DOM mutation tests; original action remains available when only feedback is disabled |
| iPhone/iPadOS routing and Vibration API priority | Public assertions plus supplied navigator measurements | `test/platform.test.tsx`; actual navigator fixtures in browser tests |
| No ambient navigator | Public helper contract | Unit missing-global cases and installed consumers removing Node's navigator before import |
| Server markup and hydration-safe hook | Reference server render omits native controls | Server/hydration tests, recoverable-error assertion, React 18/19 installed SSR checks, Next.js static build |
| Native physical-tap system tick | README and WebKit native-control contract | Independently implemented switch association; browser behavior checks; physical certification remains open in #9 |
| One native target action and parent click | Measured reference counts/ref/focus | Unit and Chromium/Firefox/WebKit browser tests |
| Completed click versus drag/scroll | Upstream assertion requires a completed click | Independent pointer/drag cancellation tests; real-browser coordinate drag check |
| Drawer pointer-down protection | Published Vaul behavior assertion | Ancestor marker integration and ordinary-pointer unit checks; real-browser drawer fixture |
| Forms, links, keyboard and auxiliary controls | Browser defaults implied by preserving the host | Browser submit/cancellation/hash-navigation/keyboard/FormData tests; auxiliary controls absent from the accessible control list |
| Construction changes, ordinary rerenders, teardown | Measured persistent engine through feedback-only changes; destroy on construction-option changes and unmount | Independent lifecycle and Strict Mode tests verify these outcomes |
| ESM and CommonJS | Upstream manifest | Actual isolated tarball imports, types, JSX, SSR, and browser bundle checks in both React versions |

File paths in the implementation/verification column are relative to `packages/haptic`.

## Intentional improvements

The wrapper preserves the public single-target contract without cloning or replacing the target's React props/ref. It lazily creates feedback resources, keeps the engine through ordinary rerenders, and releases it on construction-option changes. The latter two lifecycle outcomes also match the measured reference. The new wrapper explicitly cancels an active pattern before disposal, including API vibration, and catches cancellation failure so disposal still happens. It catches rejected/synchronous feedback failures while preserving actions; the reference produced an unhandled rejection when its previously available Vibration API was removed. Moved and canceled native-overlay gestures are explicitly rejected. Inert hosts also suppress feedback.

A reference fragment is accepted, preserves descendant actions, and does not request vibration on descendant clicks. The new wrapper can add feedback to a fragment's first host. Use one host/custom component as the documented target; multiple independent hosts in a fragment remain outside the supported single-target interaction contract. A custom component returning no DOM safely has no feedback. Null, text, and array children throw the measured public error message in both implementations.

## Remaining characterization and release evidence

The recorded reference consumer proves preset output, default/disabled/ARIA behavior, event ordering and cancellation, alias identity, ref/focus, and several platform identities. It does **not** prove hardware output or every undocumented edge case.

Additional independent black-box consumers now record [custom components, fragments, invalid children, host mutations, lifecycle, option changes, and API-removal failures](reference-edge-observations.json) and [real Chromium/WebKit keyboard, forms, canceled submit, navigation, and FormData outcomes](reference-browser-observations.json). They execute the pinned reference's distributed build with its own React version; they do not inspect implementation bodies. All measured original host-action outcomes are retained. Constructed iOS navigator identities prove routing/DOM behavior, not physical output.

React 18/19 packed-consumer checks validate installed builds, and `npm run test:matrix` runs the entire component/hook/hydration/lifecycle/engine suite in isolated React 18.3.1 and 19.3.0 installations. Physical VoiceOver/device tests remain distinct checks. Do not replace them with coverage percentages.

The complete release additionally requires #9 physical-device observations, #12 deployed docs/CI evidence, #13 npm account/trust preparation, and #14 actual registry/provenance verification. Pending results remain pending.
