"use client";

import { defaultPatterns, type HapticInput, type TriggerOptions, type Vibration } from 'web-haptics';
import type { HapticCapability } from './feedback';
import { isIOSWebKitWithoutVibration } from './platform';

export interface HapticTriggerResult {
  /** The browser accepted a feedback request; this does not certify tactile output. */
  delivered: boolean;
  mechanism: 'browser-vibration' | 'physical-tap' | 'none';
  reason?: string;
}

/** Probe imperative availability now, without creating DOM or requesting feedback. */
export function canTriggerHaptic(): HapticCapability {
  let reason: string;
  if (typeof document === 'undefined' || typeof navigator === 'undefined') reason = 'browser-unavailable';
  else if (document.hidden) reason = 'document-hidden';
  else if (typeof navigator.vibrate === 'function') {
    if (navigator.userActivation?.hasBeenActive === false) reason = 'user-activation-required';
    else return { available: true, mechanism: 'browser-vibration', observed: false };
  } else if (isIOSWebKitWithoutVibration()) {
    // Transient activation alone cannot make a script-generated switch click trusted.
    reason = navigator.userActivation?.isActive ? 'trusted-physical-tap-required' : 'user-activation-required';
  } else reason = 'vibration-unavailable';
  return { available: false, mechanism: 'none', observed: false, reason };
}

/** Encode the retained engine's duration/intensity contract without its auxiliary DOM. */
function vibrationPattern(input: HapticInput, options?: TriggerOptions): number[] | null {
  let events: readonly Vibration[];
  if (typeof input === 'number') events = [{ duration: input }];
  else if (typeof input === 'string') {
    if (!Object.prototype.hasOwnProperty.call(defaultPatterns, input)) return null;
    events = defaultPatterns[input as keyof typeof defaultPatterns].pattern;
  } else {
    const values = Array.isArray(input) ? input : input?.pattern;
    if (!Array.isArray(values)) return null;
    if (values.every(value => typeof value === 'number')) {
      const converted: Vibration[] = [];
      for (let index = 0; index < values.length; index += 2) {
        const duration = values[index] as number;
        const delay = index === 0 ? 0 : values[index - 1] as number;
        converted.push({ duration, delay });
      }
      events = converted;
    } else events = values as Vibration[];
  }
  const intensity = options?.intensity ?? 0.5;
  if (!Number.isFinite(intensity)) return null;
  const pattern: number[] = [];
  for (const event of events) {
    if (!event || !Number.isFinite(event.duration) || event.duration < 0 ||
      (event.delay !== undefined && (!Number.isFinite(event.delay) || event.delay < 0)) ||
      (event.intensity !== undefined && !Number.isFinite(event.intensity))) return null;
    const duration = Math.min(event.duration, 1000);
    const strength = Math.max(0, Math.min(1, event.intensity ?? intensity));
    const delay = event.delay ?? 0;
    if (delay > 0) {
      if (pattern.length === 0) pattern.push(0);
      if (pattern.length % 2 === 0) pattern[pattern.length - 1] += delay;
      else pattern.push(delay);
    }
    if (strength <= 0) {
      if (pattern.length > 0 && pattern.length % 2 === 0) pattern[pattern.length - 1] += duration;
      else if (duration > 0) pattern.push(0, duration);
    } else if (strength >= 1) pattern.push(duration);
    else {
      // Pulse-width modulation uses the same 20ms duty cycle as web-haptics.
      const on = Math.max(1, Math.round(20 * strength));
      const cycles = Math.floor(duration / 20);
      for (let cycle = 0; cycle < cycles; cycle++) pattern.push(on, 20 - on);
      const remainder = duration % 20;
      if (remainder > 0) {
        const lastOn = Math.max(1, Math.round(remainder * strength));
        pattern.push(lastOn);
        if (remainder > lastOn) pattern.push(remainder - lastOn);
      }
    }
  }
  return pattern;
}

/** Request feedback synchronously before returning a promise. Feedback failures never throw. */
export async function triggerHaptic(cue: HapticInput = 'selection', options?: TriggerOptions): Promise<HapticTriggerResult> {
  try {
    const capability = canTriggerHaptic();
    if (!capability.available) return { delivered: false, mechanism: 'none', reason: capability.reason };
    const pattern = vibrationPattern(cue, options);
    if (!pattern) return { delivered: false, mechanism: 'none', reason: 'invalid-input' };
    if (!pattern.some((duration, index) => index % 2 === 0 && duration > 0)) {
      return { delivered: false, mechanism: 'none', reason: 'empty-pattern' };
    }
    return navigator.vibrate(pattern)
      ? { delivered: true, mechanism: 'browser-vibration' }
      : { delivered: false, mechanism: 'none', reason: 'vibration-rejected' };
  } catch {
    return { delivered: false, mechanism: 'none', reason: 'vibration-error' };
  }
}
