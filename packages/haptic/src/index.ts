"use client";

export { Haptic, HapticTarget, type HapticTargetProps } from './haptic';
export { isIOSWebKitWithoutVibration, useIOSNativeHaptics } from './platform';
export { canTriggerHaptic, triggerHaptic, type HapticTriggerResult } from './trigger';
export { haptics, useHaptics } from './web';
export { hapticsEnabled, setHapticsEnabled, subscribeHapticsEnabled } from './gate';
export type { HapticKind, HapticsApi } from './kinds';
export type { HapticCapability } from './feedback';
export type { HapticInput, HapticPattern, HapticPreset, TriggerOptions, Vibration, WebHapticsOptions } from 'web-haptics';
