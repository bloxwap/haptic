# Physical-device certification

Run this against the implementation commit and its live docs/demo (or a static preview reachable from the device). Record the commit, date, tester, device model, OS/browser versions, haptic/audio settings, and every pass/fail/unsupported outcome in [#9](https://github.com/bloxwap/haptic/issues/9). All current physical observations are **pending**.

Browser automation proves action/DOM semantics. A successful `navigator.vibrate` call proves an API request. Only a tester holding the device can establish the physical response. Do not convert emulation or simulator results into physical observations.

## iPhone / Safari

1. Open the preset board. Tap selection/light/success and the custom pattern. Confirm a system tick on each completed physical tap and one action-count increment, independent of requested pattern/intensity. Record the actual tested minimum and latest iOS/Safari versions; the Safari 17.4 native-switch introduction is only a candidate baseline.
2. Disable feedback and repeat. Actions still increment; physical feedback stops. Check the disabled target in Interaction examples.
3. Enable feedback, hold/scroll/drag over a target, and cancel a touch. No action should occur without a completed click. Repeat normal taps afterward.
4. In Interaction examples, count an action, focus the original button, navigate the link, and submit the form. Verify normal focus/navigation/submission once. Test reset and `preventDefault` using the browser fixture if the form requires it.
5. Open the real Vaul drawer and tap its action. It should increment once and remain open without starting an ancestor drag. Confirm ordinary drawer dragging outside the action still works.
6. With a hardware keyboard, tab to the original target and activate it. Actions work and no auxiliary checkbox enters the tab order. Programmatic `.click()`, timers, and async callbacks are not physical-feedback guarantees.
7. Record system-haptic settings. Disable system haptics and repeat ordinary actions, then restore the initial settings. Record tactile results rather than inferring them from DOM state.

### Imperative API (#27, unreleased)

Use the Imperative feedback section of Interaction examples. Compare **Request now**, **Request after await**, and **Request from timer** against the physical target's system tick. Record tactile observations separately from the on-screen availability/request result for each button. Current code reports iOS imperative requests unavailable, including inside an active click: [WebKit requires a trusted event on the switch](https://github.com/WebKit/WebKit/commit/fc1ef83eae10068fe468587d959e868041ddfe03), and script-created label clicks do not meet that requirement. Do not infer support from `navigator.userActivation.isActive` or a changed checkbox. No imperative iOS route may be advertised as observed without new physical evidence and a supported mechanism.

On Android, compare the synchronous, awaited and timer requests after activating the page. The page must remain visible. Record whether `navigator.vibrate` accepted each request and whether feedback was physically felt; these are separate results. Also test a fresh page before any interaction, a hidden page, and a browser without vibration support. No auxiliary controls should appear, change the original focus, or enter VoiceOver/TalkBack navigation.

## Android / Chrome

1. Verify the device/browser actually supports vibration and record its settings. Tap all eleven presets and the custom pattern; identify the observed duration/rhythm rather than treating a successful API call as proof.
2. Compare intensity settings, duration input, alternating numeric pattern, vibration events with delay/intensity, and preset objects. Use the typed examples or interaction fixture for inputs beyond the board's controls.
3. Repeat feedback disabling, disabled/ARIA hosts, refs/focus, parent clicks, keyboard, links, submit/reset and cancellation. Confirm actions remain available on unsupported/disabled feedback.
4. Change engine/debug/showSwitch options and repeatedly mount/unmount targets in the fixture. Check for persistent controls, continuing patterns/audio, or duplicated actions. Confirm desktop audio preview separately in a browser with audio support.

## iPadOS and VoiceOver

Record iPadOS desktop-mode routing and its actual hardware response. A device without the necessary tactile hardware should be recorded as unsupported, with ordinary actions still passing. It must not inherit an iPhone physical-feedback claim.

On iPhone with VoiceOver, navigate through the board and interaction examples. Each target has its original label/role, no extra checkbox/label is announced, activation invokes the original action once, and focus remains useful through form/link/drawer interactions. Record the spoken targets and any failure. Automated axe results do not substitute for this check.

## Evidence format

Keep `device-results.json` pending until the required checks pass. On certification, set `status` to `certified`, a real 40-character `testedCommit`, and `checkedAt`. Add observations with kinds `iphone-safari`, `android-chrome`, `ipados`, and `voiceover`, each containing `model`, `os`, `browser`, `settings`, `result` (`pass`, `fail`, or `unsupported`), and an `evidence` link to the detailed recorded results. iPhone, Android, and VoiceOver must pass; iPadOS may be unsupported with an explanation.

Commit only truthful observations. Runtime-source or runtime/peer-dependency changes invalidate the release gate's recorded certification and require retesting.
