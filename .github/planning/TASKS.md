# Haptic task backlog

The [tracking issue](https://github.com/bloxwap/haptic/issues/1) owns the complete rebuild and initial npm release. All tasks belong to the **Initial npm release** milestone and include acceptance criteria and verification evidence.

| Issue | Outcome | Priority | Depends on |
| --- | --- | --- | --- |
| [#2](https://github.com/bloxwap/haptic/issues/2) | Specify the complete public API and clean-room compatibility contract | P0 | None |
| [#3](https://github.com/bloxwap/haptic/issues/3) | Set up the consolidated Bloxwap package and docs workspace | P0 | [#2](https://github.com/bloxwap/haptic/issues/2) |
| [#4](https://github.com/bloxwap/haptic/issues/4) | Implement SSR-safe platform detection and the iOS React hook | P0 | [#3](https://github.com/bloxwap/haptic/issues/3) |
| [#5](https://github.com/bloxwap/haptic/issues/5) | Integrate all vibration feedback forms and web-haptics options | P0 | [#3](https://github.com/bloxwap/haptic/issues/3), [#2](https://github.com/bloxwap/haptic/issues/2) |
| [#6](https://github.com/bloxwap/haptic/issues/6) | Implement Haptic and HapticTarget with preserved target behavior | P0 | [#4](https://github.com/bloxwap/haptic/issues/4), [#5](https://github.com/bloxwap/haptic/issues/5) |
| [#7](https://github.com/bloxwap/haptic/issues/7) | Implement native iOS feedback for physical taps | P0 | [#6](https://github.com/bloxwap/haptic/issues/6) |
| [#8](https://github.com/bloxwap/haptic/issues/8) | Add independent compatibility, accessibility, and lifecycle regression tests | P0 | [#6](https://github.com/bloxwap/haptic/issues/6), [#7](https://github.com/bloxwap/haptic/issues/7) |
| [#9](https://github.com/bloxwap/haptic/issues/9) | Certify iOS and Android behavior on physical devices | P0 | [#7](https://github.com/bloxwap/haptic/issues/7), [#5](https://github.com/bloxwap/haptic/issues/5), [#8](https://github.com/bloxwap/haptic/issues/8) |
| [#10](https://github.com/bloxwap/haptic/issues/10) | Build branded documentation, demos, and Bloxwap-style READMEs | P1 | [#6](https://github.com/bloxwap/haptic/issues/6), [#7](https://github.com/bloxwap/haptic/issues/7) |
| [#11](https://github.com/bloxwap/haptic/issues/11) | Validate ESM, CommonJS, declarations, and the npm tarball | P0 | [#3](https://github.com/bloxwap/haptic/issues/3), [#6](https://github.com/bloxwap/haptic/issues/6), [#7](https://github.com/bloxwap/haptic/issues/7), [#5](https://github.com/bloxwap/haptic/issues/5) |
| [#12](https://github.com/bloxwap/haptic/issues/12) | Add CI verification and deploy the docs to GitHub Pages | P1 | [#8](https://github.com/bloxwap/haptic/issues/8), [#10](https://github.com/bloxwap/haptic/issues/10), [#11](https://github.com/bloxwap/haptic/issues/11) |
| [#13](https://github.com/bloxwap/haptic/issues/13) | Prepare npm scope access, first-publish bootstrap, and trusted publishing | P0 | [#12](https://github.com/bloxwap/haptic/issues/12), [#11](https://github.com/bloxwap/haptic/issues/11) |
| [#14](https://github.com/bloxwap/haptic/issues/14) | Publish and verify the first @bloxwap/haptic npm release | P0 | [#9](https://github.com/bloxwap/haptic/issues/9), [#10](https://github.com/bloxwap/haptic/issues/10), [#11](https://github.com/bloxwap/haptic/issues/11), [#12](https://github.com/bloxwap/haptic/issues/12), [#13](https://github.com/bloxwap/haptic/issues/13) |

P0 tasks preserve functionality or establish release evidence. P1 tasks complete the required documentation and automation. Both priorities are required for the initial release.

Read the [evaluation](EVALUATION.md) before implementation. The ordering above permits independent platform and engine work after workspace setup, then combines them in the React wrapper. Documentation and package validation can proceed once behavior is implemented. Physical-device results and live/registry checks remain release gates.
