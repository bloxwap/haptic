import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';
import { createHapticsApi, type HapticKind, type HapticsApi } from './kinds';
import { createHapticLanes, type NativeHapticBackend } from './lanes';

export { hapticsEnabled, setHapticsEnabled, subscribeHapticsEnabled } from './gate';
export type { HapticKind, HapticsApi } from './kinds';
export type { NativeHapticBackend } from './lanes';

/** The subset of `expo-haptics` this package calls. Pass the module itself. */
export interface ExpoHapticsModule {
  ImpactFeedbackStyle: { Light: unknown; Medium: unknown; Heavy: unknown };
  NotificationFeedbackType: { Success: unknown; Warning: unknown; Error: unknown };
  AndroidHaptics?: Record<'Segment_Tick' | 'Virtual_Key' | 'Context_Click' | 'Long_Press' | 'Confirm' | 'Reject', unknown>;
  selectionAsync: () => Promise<void>;
  impactAsync: (style: never) => Promise<void>;
  notificationAsync: (type: never) => Promise<void>;
  performAndroidHapticsAsync?: (type: never) => Promise<void>;
}

/**
 * Android uses View.performHapticFeedback constants rather than Expo's
 * impact/notification calls, which Expo implements with Vibrator effects there.
 */
const ANDROID_CONSTANT = {
  selection: 'Segment_Tick',
  light: 'Virtual_Key',
  medium: 'Context_Click',
  heavy: 'Long_Press',
  success: 'Confirm',
  warning: 'Reject',
  error: 'Reject',
} as const satisfies Record<HapticKind, string>;

/**
 * Build the platform backend from the `expo-haptics` module. Enum values are
 * resolved once here so each tap is a direct native call with no lookups.
 */
export function createExpoHapticBackend(haptics: ExpoHapticsModule, os: string = Platform.OS): NativeHapticBackend {
  type Call = (value: unknown) => Promise<void>;
  const android = os === 'android' && haptics.AndroidHaptics && haptics.performAndroidHapticsAsync;
  if (android) {
    const perform = haptics.performAndroidHapticsAsync as Call;
    const constant = (kind: HapticKind) => haptics.AndroidHaptics![ANDROID_CONSTANT[kind]];
    const selection = constant('selection');
    const impact = { light: constant('light'), medium: constant('medium'), heavy: constant('heavy') };
    const notification = { success: constant('success'), warning: constant('warning'), error: constant('error') };
    return {
      selection: () => perform(selection),
      impact: style => perform(impact[style]),
      notification: type => perform(notification[type]),
    };
  }
  const impactAsync = haptics.impactAsync as Call;
  const notificationAsync = haptics.notificationAsync as Call;
  const impact = {
    light: haptics.ImpactFeedbackStyle.Light,
    medium: haptics.ImpactFeedbackStyle.Medium,
    heavy: haptics.ImpactFeedbackStyle.Heavy,
  };
  const notification = {
    success: haptics.NotificationFeedbackType.Success,
    warning: haptics.NotificationFeedbackType.Warning,
    error: haptics.NotificationFeedbackType.Error,
  };
  return {
    selection: () => haptics.selectionAsync(),
    impact: style => impactAsync(impact[style]),
    notification: type => notificationAsync(notification[type]),
  };
}

function defaultBackend(): NativeHapticBackend | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  return createExpoHapticBackend(ExpoHaptics as unknown as ExpoHapticsModule, Platform.OS);
}

const lanes = /* @__PURE__ */ createHapticLanes(defaultBackend);

/**
 * Cross-platform imperative haptics. On iOS and Android this drives
 * `expo-haptics` through per-cue lanes that collapse bursts.
 */
export const haptics: HapticsApi = /* @__PURE__ */ createHapticsApi(lanes.fire);

/** Return the stable `haptics` object. Safe to call outside React; never re-renders. */
export function useHaptics(): HapticsApi {
  return haptics;
}

/**
 * Replace the physical backend, for tests or a custom engine. `null` silences
 * haptics. Returns a function that restores the previous backend.
 */
export function installHapticBackend(backend: NativeHapticBackend | null): () => void {
  return lanes.install(backend);
}
