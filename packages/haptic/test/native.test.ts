import { describe, expect, it, vi } from 'vitest';
import type { NativeHapticBackend } from '../src/native';

type Native = typeof import('../src/native');
type Expo = typeof import('./stubs/expo-haptics');

let expo: Expo;

/** Fresh module state per test: lanes, gate, stubs and the lazily resolved default backend. */
async function load(os = 'ios'): Promise<Native> {
  vi.resetModules();
  expo = await import('expo-haptics') as unknown as Expo;
  (await import('react-native')).Platform.OS = os;
  return import('../src/native');
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

/** A backend whose calls stay in flight until the test settles them. */
function manualBackend() {
  const inflight: ReturnType<typeof deferred>[] = [];
  const call = vi.fn((_cue: string) => { const next = deferred(); inflight.push(next); return next.promise; });
  const backend: NativeHapticBackend = { selection: () => call('selection'), impact: style => call(style), notification: type => call(type) };
  return { backend, call, inflight };
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));


describe('default expo-haptics backend', () => {
  it('maps every cue to expo-haptics on iOS, resolving lazily on first use', async () => {
    const { haptics, useHaptics } = await load('ios');
    expect(useHaptics()).toBe(haptics);
    expect(expo.selectionAsync).not.toHaveBeenCalled();
    haptics.selection(); haptics.light(); haptics.medium(); haptics.heavy();
    haptics.success(); haptics.warning(); haptics.error();
    expect(expo.selectionAsync).toHaveBeenCalledOnce();
    expect(expo.impactAsync.mock.calls).toEqual([['light'], ['medium'], ['heavy']]);
    expect(expo.notificationAsync.mock.calls).toEqual([['success'], ['warning'], ['error']]);
    expect(expo.performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('uses Android HapticFeedbackConstants on Android', async () => {
    const { haptics } = await load('android');
    haptics.selection(); haptics.light(); haptics.medium(); haptics.heavy();
    haptics.success(); haptics.warning(); haptics.error();
    expect(expo.performAndroidHapticsAsync.mock.calls.map(call => call[0])).toEqual([
      'segment-tick', 'virtual-key', 'context-click', 'long-press', 'confirm', 'reject', 'reject',
    ]);
    expect(expo.selectionAsync).not.toHaveBeenCalled();
    expect(expo.impactAsync).not.toHaveBeenCalled();
  });

  it('is silent on platforms without a Taptic Engine or vibrator', async () => {
    const { haptics } = await load('web');
    haptics.selection(); haptics.success();
    await flush();
    expect(expo.selectionAsync).not.toHaveBeenCalled();
    expect(expo.performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('falls back to impact/notification calls when an older expo-haptics lacks Android constants', async () => {
    const { createExpoHapticBackend } = await load('android');
    const legacy = { ...expo, AndroidHaptics: undefined, performAndroidHapticsAsync: undefined };
    const backend = createExpoHapticBackend(legacy);
    await backend.selection(); await backend.impact('heavy'); await backend.notification('warning');
    expect(expo.selectionAsync).toHaveBeenCalledOnce();
    expect(expo.impactAsync).toHaveBeenCalledWith('heavy');
    expect(expo.notificationAsync).toHaveBeenCalledWith('warning');
  });
});

describe('per-cue lanes', () => {
  it('collapses a burst into one in-flight call plus one trailing replay', async () => {
    const { haptics, installHapticBackend } = await load();
    const { backend, call, inflight } = manualBackend();
    installHapticBackend(backend);
    for (let tap = 0; tap < 50; tap++) haptics.selection();
    expect(call).toHaveBeenCalledOnce();
    inflight[0].resolve();
    await flush();
    expect(call).toHaveBeenCalledTimes(2);
    inflight[1].resolve();
    await flush();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('keeps cues independent so a busy selection lane never delays a notification', async () => {
    const { haptics, installHapticBackend } = await load();
    const { backend, call } = manualBackend();
    installHapticBackend(backend);
    haptics.selection(); haptics.selection(); haptics.success(); haptics.heavy();
    expect(call.mock.calls).toEqual([['selection'], ['success'], ['heavy']]);
  });

  it('releases a lane when the native call rejects, throws, or returns no promise', async () => {
    const { haptics, installHapticBackend } = await load();
    const { backend, call, inflight } = manualBackend();
    installHapticBackend(backend);
    haptics.selection(); haptics.selection();
    inflight[0].reject(new Error('unsupported hardware'));
    await flush();
    expect(call).toHaveBeenCalledTimes(2);

    const throwing = vi.fn(() => { throw new Error('module missing'); });
    installHapticBackend({ selection: throwing, impact: throwing, notification: throwing });
    haptics.heavy(); haptics.heavy();
    expect(throwing).toHaveBeenCalledTimes(2);

    const sync = vi.fn(() => undefined as unknown as Promise<void>);
    installHapticBackend({ selection: sync, impact: sync, notification: sync });
    haptics.warning(); haptics.warning();
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it('drops trailing replays when disabled, even if re-enabled before settlement', async () => {
    const { haptics, installHapticBackend, setHapticsEnabled, hapticsEnabled } = await load();
    const { backend, call, inflight } = manualBackend();
    installHapticBackend(backend);
    haptics.selection(); haptics.selection(); haptics.medium();
    setHapticsEnabled(false);
    expect(hapticsEnabled()).toBe(false);
    haptics.error();
    setHapticsEnabled(true);
    inflight.forEach(next => next.resolve());
    await flush();
    expect(call.mock.calls).toEqual([['selection'], ['medium']]);
  });

  it('installs, silences and restores backends', async () => {
    const { haptics, installHapticBackend } = await load();
    const silence = installHapticBackend(null);
    haptics.selection();
    expect(expo.selectionAsync).not.toHaveBeenCalled();

    const custom = vi.fn(() => Promise.resolve());
    const restoreCustom = installHapticBackend({ selection: custom, impact: custom, notification: custom });
    haptics.light();
    expect(custom).toHaveBeenCalledOnce();

    silence(); // Retire the older scope without disturbing the current backend.
    await flush();
    haptics.light();
    expect(custom).toHaveBeenCalledTimes(2);

    restoreCustom();
    await flush();
    haptics.light();
    expect(custom).toHaveBeenCalledTimes(2);
    expect(expo.impactAsync).toHaveBeenCalledExactlyOnceWith('light');
  });
});

describe('enable gate', () => {
  it('notifies subscribers only on change and isolates throwing listeners', async () => {
    const { setHapticsEnabled, subscribeHapticsEnabled } = await load();
    const seen: boolean[] = [];
    subscribeHapticsEnabled(() => { throw new Error('bad subscriber'); });
    const unsubscribe = subscribeHapticsEnabled(on => seen.push(on));
    setHapticsEnabled(true);
    setHapticsEnabled(false);
    setHapticsEnabled(false);
    unsubscribe();
    setHapticsEnabled(true);
    expect(seen).toEqual([false]);
  });
});
