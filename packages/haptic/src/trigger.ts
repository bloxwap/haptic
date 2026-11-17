"use client";

import type { HapticInput, TriggerOptions, Vibration } from 'web-haptics';
import type { HapticCapability } from './feedback';
import { isIOSWebKitWithoutVibration } from './platform';
import { defaultPatterns } from './presets';
import { requestVibration } from './vibration';

export interface HapticTriggerResult {
  /** The browser accepted a feedback request; this does not certify tactile output. */
  delivered: boolean;
  mechanism: 'browser-vibration' | 'physical-tap' | 'none';
  reason?: string;
}

/** Why imperative feedback is unavailable right now, or undefined when it is available. */
export function unavailableReason(): string | undefined {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return 'browser-unavailable';
  if (document.hidden) return 'document-hidden';
  if (typeof navigator.vibrate === 'function') {
    return navigator.userActivation?.hasBeenActive === false ? 'user-activation-required' : undefined;
  }
  // Transient activation alone cannot make a script-generated switch click trusted.
  if (isIOSWebKitWithoutVibration()) return navigator.userActivation?.isActive ? 'trusted-physical-tap-required' : 'user-activation-required';
  return 'vibration-unavailable';
}

/** Probe imperative availability now, without creating DOM or requesting feedback. */
export function canTriggerHaptic(): HapticCapability {
  const reason = unavailableReason();
  return reason === undefined
    ? { available: true, mechanism: 'browser-vibration', observed: false }
    : { available: false, mechanism: 'none', observed: false, reason };
}

/** Work budgets apply before expansion, independently of browser-specific truncation. */
const MAX_EVENTS = 64;
const MAX_ENTRIES = 1024;
const MAX_TOTAL_MS = 10000;
export interface FeedbackPulse { duration: number; delay: number; intensity: number }

/** Validate, bound and encode both imperative and component feedback identically. */
export function prepareFeedback(input: HapticInput, options?: TriggerOptions): { events: FeedbackPulse[]; pattern: number[] } | null {
  let values: readonly Vibration[];
  if (typeof input === 'number') values = [{ duration: input }];
  else if (typeof input === 'string') {
    if (!Object.prototype.hasOwnProperty.call(defaultPatterns, input)) return null;
    values = defaultPatterns[input as keyof typeof defaultPatterns].pattern;
  } else {
    const raw = Array.isArray(input) ? input : input?.pattern;
    if (!Array.isArray(raw) || raw.length > MAX_EVENTS * 2) return null;
    if (raw.every(value => typeof value === 'number')) {
      if (raw.some(value => !Number.isFinite(value) || value < 0)) return null;
      const converted: Vibration[] = [];
      for (let index = 0; index < raw.length; index += 2) {
        converted.push({ duration: raw[index], delay: index === 0 ? 0 : raw[index - 1] });
      }
      values = converted;
    } else values = raw as Vibration[];
  }
  if (values.length > MAX_EVENTS) return null;
  const intensity = options?.intensity ?? 0.5;
  if (!Number.isFinite(intensity)) return null;
  const events: FeedbackPulse[] = [];
  const pattern: number[] = [];
  let total = 0;
  // Append a segment by phase, merging adjacent segments of the same phase.
  const append = (duration: number, on: boolean) => {
    if (duration <= 0) return;
    const last = pattern.length - 1;
    if (last >= 0 && (last % 2 === 0) === on) pattern[last] += duration;
    else {
      if (last < 0 && !on) pattern.push(0);
      pattern.push(duration);
    }
  };
  for (const event of values) {
    if (!event || !Number.isFinite(event.duration) || event.duration < 0 ||
      (event.delay !== undefined && (!Number.isFinite(event.delay) || event.delay < 0)) ||
      (event.intensity !== undefined && !Number.isFinite(event.intensity))) return null;
    const duration = Math.min(Math.floor(event.duration), 1000);
    const delay = Math.floor(event.delay ?? 0);
    const strength = Math.max(0, Math.min(1, event.intensity ?? intensity));
    total += delay + duration;
    if (total > MAX_TOTAL_MS) return null;
    events.push({ duration, delay, intensity: strength });
    append(delay, false);
    if (strength <= 0 || strength >= 1) append(duration, strength >= 1);
    else {
      for (let remaining = duration; remaining > 0; remaining -= 20) {
        const cycle = Math.min(20, remaining);
        const on = Math.max(1, Math.round(cycle * strength));
        append(on, true);
        append(cycle - on, false);
        if (pattern.length > MAX_ENTRIES) return null;
      }
    }
    if (pattern.length > MAX_ENTRIES) return null;
  }
  return { events, pattern };
}

export function vibrationPattern(input: HapticInput, options?: TriggerOptions): number[] | null {
  return prepareFeedback(input, options)?.pattern ?? null;
}

/** Request feedback synchronously before returning a promise. Feedback failures never throw. */
export async function triggerHaptic(cue: HapticInput = 'selection', options?: TriggerOptions): Promise<HapticTriggerResult> {
  try {
    const reason = unavailableReason();
    if (reason !== undefined) return { delivered: false, mechanism: 'none', reason };
    const pattern = vibrationPattern(cue, options);
    if (!pattern) return { delivered: false, mechanism: 'none', reason: 'invalid-input' };
    if (!pattern.some((duration, index) => index % 2 === 0 && duration > 0)) {
      return { delivered: false, mechanism: 'none', reason: 'empty-pattern' };
    }
    return requestVibration(pattern)
      ? { delivered: true, mechanism: 'browser-vibration' }
      : { delivered: false, mechanism: 'none', reason: 'vibration-rejected' };
  } catch {
    return { delivered: false, mechanism: 'none', reason: 'vibration-error' };
  }
}
