"use client";

import { hapticsEnabled } from './gate';
import { createHapticsApi, type HapticKind, type HapticsApi } from './kinds';
import { vibrationPattern } from './trigger';
import { requestVibration } from './vibration';

// Presets compile to the same vibration arrays every time; build each once.
// navigator.vibrate copies its argument, so reusing the array is safe.
const compiled: Partial<Record<HapticKind, number[]>> = {};
// Sticky user activation never reverts within a page, so it is read until first seen.
let activated = false;

/**
 * The hot path checks only what can change the outcome. It skips
 * `document.hidden`: browsers already return false for a hidden page without
 * a console intervention, and `triggerHaptic` keeps the full probe for
 * callers that need a reason.
 */
function fire(kind: HapticKind): void {
  if (!hapticsEnabled() || typeof navigator === 'undefined') return;
  // iOS WebKit has no Vibration API; <Haptic> covers taps there.
  if (typeof navigator.vibrate !== 'function') return;
  if (!activated) {
    // Calling before any user gesture logs a Chrome intervention warning; skip instead.
    if (navigator.userActivation?.hasBeenActive === false) return;
    activated = true;
  }
  try {
    requestVibration(compiled[kind] ??= vibrationPattern(kind) as number[]);
  } catch { /* Feedback cannot break the host action. */ }
}

/**
 * Cross-platform imperative haptics. In browsers this calls the Vibration API
 * directly, with no DOM, engine instance or animation frames.
 */
export const haptics: HapticsApi = /* @__PURE__ */ createHapticsApi(fire);

/** Return the stable `haptics` object. Safe to call outside React; never re-renders. */
export function useHaptics(): HapticsApi {
  return haptics;
}
