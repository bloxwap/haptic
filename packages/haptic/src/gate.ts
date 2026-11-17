/** A realm-wide gate shared by ESM, CommonJS, web and native entry points. */
const key = Symbol.for('@bloxwap/haptic/gate/v1');
interface Gate {
  enabled: boolean;
  disabledRevision: number;
  notifying: boolean;
  pending: boolean | undefined;
  listeners: Set<(on: boolean) => void>;
}
function gate(): Gate {
  const registry = globalThis as typeof globalThis & { [key]?: Gate };
  return registry[key] ??= { enabled: true, disabledRevision: 0, notifying: false, pending: undefined, listeners: new Set() };
}

/** Whether `haptics.*` accepts new feedback. Persistence belongs to the host. */
export function hapticsEnabled(): boolean { return gate().enabled; }
/** Invalidates queued native work even when off is immediately followed by on. */
export function disabledRevision(): number { return gate().disabledRevision; }

/** Queue reentrant changes so every subscriber sees a consistent state. */
export function setHapticsEnabled(on: boolean): void {
  const state = gate();
  state.pending = on;
  if (state.notifying) return;
  state.notifying = true;
  try {
    while (state.pending !== undefined) {
      const next = state.pending;
      state.pending = undefined;
      if (next === state.enabled) continue;
      state.enabled = next;
      if (!next) state.disabledRevision++;
      for (const listener of [...state.listeners]) {
        if (!state.listeners.has(listener)) continue;
        try { listener(next); } catch { /* Subscribers cannot break the gate. */ }
      }
    }
  } finally { state.notifying = false; }
}

/** Observe changes. Subscriptions added during notification start on the next change. */
export function subscribeHapticsEnabled(listener: (on: boolean) => void): () => void {
  const state = gate();
  state.listeners.add(listener);
  return () => { state.listeners.delete(listener); };
}
