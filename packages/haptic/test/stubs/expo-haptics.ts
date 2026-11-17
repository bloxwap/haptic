import { vi } from 'vitest';

// Stand-in for expo-haptics, aliased in vitest.config.ts. Enum values mirror Expo's string enums.
export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' };
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };
export const AndroidHaptics = {
  Segment_Tick: 'segment-tick', Virtual_Key: 'virtual-key', Context_Click: 'context-click',
  Long_Press: 'long-press', Confirm: 'confirm', Reject: 'reject',
};
export const selectionAsync = vi.fn(() => Promise.resolve());
export const impactAsync = vi.fn((_style?: unknown) => Promise.resolve());
export const notificationAsync = vi.fn((_type?: unknown) => Promise.resolve());
export const performAndroidHapticsAsync = vi.fn((_type: unknown) => Promise.resolve());
