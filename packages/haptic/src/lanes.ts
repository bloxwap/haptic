import { disabledRevision, hapticsEnabled } from './gate';
import type { HapticKind } from './kinds';

/** Structurally identical to @bloxwap/hig/feedback/native `NativeHapticBackend`. */
export interface NativeHapticBackend {
  selection: () => Promise<unknown>;
  impact: (style: 'light' | 'medium' | 'heavy') => Promise<unknown>;
  notification: (type: 'success' | 'warning' | 'error') => Promise<unknown>;
}

type Calls = { [Kind in HapticKind]: () => unknown };
interface Installation { calls: Calls | null; resolved: boolean; retired: boolean; previous?: Installation }
interface Flight { timer?: ReturnType<typeof setTimeout>; revision: number }
interface Lane { flight?: Flight; trailing: boolean }
/** Stop tracking hung native calls after one second; never replay their stale taps. */
const TIMEOUT = 1000;
function compile(backend: NativeHapticBackend): Calls {
  return {
    selection: () => backend.selection(),
    light: () => backend.impact('light'), medium: () => backend.impact('medium'), heavy: () => backend.impact('heavy'),
    success: () => backend.notification('success'), warning: () => backend.notification('warning'), error: () => backend.notification('error'),
  };
}

/** One tracked call and at most one trailing replay per cue, within the current installation. */
export function createHapticLanes(resolveDefault: () => NativeHapticBackend | null) {
  const root: Installation = { calls: null, resolved: false, retired: false };
  let current = root;
  const lanes = new Map<HapticKind, Lane>();
  function reset(): void {
    for (const lane of lanes.values()) {
      clearTimeout(lane.flight?.timer);
      lane.flight = undefined;
      lane.trailing = false;
    }
    lanes.clear();
  }
  function fire(kind: HapticKind): void {
    if (!hapticsEnabled()) return;
    try {
      if (!current.resolved) {
        const backend = resolveDefault();
        current.calls = backend ? compile(backend) : null;
        current.resolved = true;
      }
      // Check silence before queuing anything.
      if (!current.calls) return;
      let lane = lanes.get(kind);
      if (!lane) { lane = { trailing: false }; lanes.set(kind, lane); }
      if (lane.flight) { lane.trailing = true; return; }
      const installation = current;
      const active = lane;
      const flight: Flight = { revision: disabledRevision() };
      active.flight = flight;
      const settle = (expired = false) => {
        if (active.flight !== flight || current !== installation) return;
        clearTimeout(flight.timer);
        active.flight = undefined;
        const replay = active.trailing && !expired && flight.revision === disabledRevision();
        active.trailing = false;
        if (replay) fire(kind);
      };
      try {
        const pending = current.calls[kind]();
        const then = (pending as PromiseLike<unknown> | null | undefined)?.then;
        if (typeof then === 'function') {
          flight.timer = setTimeout(() => settle(true), TIMEOUT);
          then.call(pending, () => settle(), () => settle());
        } else settle();
      } catch { settle(true); }
    } catch { /* A failed default resolver remains unresolved and can recover on the next cue. */ }
  }
  return {
    fire,
    /** Restore removes this scope, even when scopes are released out of order. */
    install(backend: NativeHapticBackend | null): () => void {
      const installation: Installation = { calls: backend ? compile(backend) : null, resolved: true, retired: false, previous: current };
      current = installation;
      reset();
      return () => {
        if (installation.retired) return;
        installation.retired = true;
        if (current !== installation) return;
        do { current = current.previous!; } while (current.retired);
        reset();
      };
    },
  };
}
