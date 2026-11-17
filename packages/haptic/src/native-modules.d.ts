// Minimal ambient shapes for the optional native peers. Consumers' real
// declarations take over; nothing here reaches the published types.
declare module 'expo-haptics' {
  export const ImpactFeedbackStyle: { Light: unknown; Medium: unknown; Heavy: unknown };
  export const NotificationFeedbackType: { Success: unknown; Warning: unknown; Error: unknown };
  export const AndroidHaptics: Record<string, unknown> | undefined;
  export function selectionAsync(): Promise<void>;
  export function impactAsync(style?: unknown): Promise<void>;
  export function notificationAsync(type?: unknown): Promise<void>;
  export function performAndroidHapticsAsync(type: unknown): Promise<void>;
}

declare module 'react-native' {
  export const Platform: { OS: string };
}
