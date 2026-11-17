// Baseline copy of bloxwap/monorepo packages/ui-native/src/hooks/use-haptics.ts at 448a49318, for A/B benchmarking only.
// Haptic lane scheduler and on/off gate. The physical backend is injected by the host: the mobile
// app installs HIG's Expo backend on iOS and its Android platform-constant backend (see
// apps/mobile/src/feedback/haptic-backend.ts). Without a backend, haptics are a no-op. Swallow
// unsupported-hardware failures so feedback cannot break interaction. Tests cover dispatch/gating;
// physical feel requires hardware.

let enabled = true;

type HapticKind =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

type PendingHaptic = {
  token: number;
  trailing: boolean;
};

let nextToken = 0;
const pending = new Map<HapticKind, PendingHaptic>();
/** Structurally identical to @bloxwap/hig/feedback/native NativeHapticBackend. */
export type HapticBackend = {
  selection: () => Promise<unknown>;
  impact: (style: "light" | "medium" | "heavy") => Promise<unknown>;
  notification: (type: "success" | "warning" | "error") => Promise<unknown>;
};

let backend: HapticBackend | null = null;

/** Install the host's physical haptic backend; returns an uninstall function. */
export function installHapticBackend(next: HapticBackend | null): () => void {
  backend = next;
  return () => {
    if (backend === next) backend = null;
  };
}

/** Runtime feedback toggle, enabled by default. */
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
  if (!on) {
    // Native in-flight work cannot be cancelled. Clear only the trailing replay and keep the
    // marker until settlement to prevent overlapping bridge commands.
    for (const state of pending.values()) state.trailing = false;
  }
}

export function hapticsEnabled(): boolean {
  return enabled;
}

function finish(kind: HapticKind, token: number): void {
  const state = pending.get(kind);
  if (!state || state.token !== token) return;
  const replay = enabled && state.trailing;
  pending.delete(kind);
  // Collapse bursts to one latest replay, setting its in-flight marker before native dispatch.
  if (replay) fire(kind);
}

function invoke(kind: HapticKind): Promise<unknown> {
  if (!backend) return Promise.resolve();
  switch (kind) {
    case "selection":
      return backend.selection();
    case "light":
    case "medium":
    case "heavy":
      return backend.impact(kind);
    case "success":
    case "warning":
    case "error":
      return backend.notification(kind);
  }
}

function fire(kind: HapticKind): void {
  if (!enabled) return;
  const active = pending.get(kind);
  if (active) {
    active.trailing = true;
    return;
  }
  const token = ++nextToken;
  pending.set(kind, { token, trailing: false });
  try {
    // Both success and failure release the lane and may replay its latest pending request.
    void invoke(kind).then(
      () => finish(kind, token),
      () => finish(kind, token),
    );
  } catch {
    finish(kind, token);
  }
}

export const haptics = {
  /** Light selection tick — for steppers, toggles, segment switches. */
  selection: () => fire("selection"),
  light: () => fire("light"),
  medium: () => fire("medium"),
  heavy: () => fire("heavy"),
  /** Notification feedback — for confirmed actions (order placed, burn sent). */
  success: () => fire("success"),
  warning: () => fire("warning"),
  error: () => fire("error"),
};

export type HapticsApi = typeof haptics;

/** Return the stable imperative haptics object. */
export function useHaptics(): HapticsApi {
  return haptics;
}
