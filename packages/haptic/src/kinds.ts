/** The seven cues every platform supports: one selection tick, three impacts, three notifications. */
export type HapticKind = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/** The cross-platform imperative API returned by `useHaptics()`. Every call is fire-and-forget. */
export interface HapticsApi {
  /** Light selection tick, for steppers, toggles and segment switches. */
  selection(): void;
  light(): void;
  medium(): void;
  heavy(): void;
  /** Notification feedback, for confirmed actions. */
  success(): void;
  warning(): void;
  error(): void;
}

export function createHapticsApi(fire: (kind: HapticKind) => void): HapticsApi {
  return {
    selection: () => fire('selection'),
    light: () => fire('light'),
    medium: () => fire('medium'),
    heavy: () => fire('heavy'),
    success: () => fire('success'),
    warning: () => fire('warning'),
    error: () => fire('error'),
  };
}
