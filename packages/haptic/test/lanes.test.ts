import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHapticLanes, type NativeHapticBackend } from '../src/lanes';
import { setHapticsEnabled } from '../src/gate';
const backend = (call: () => Promise<unknown>): NativeHapticBackend => ({ selection: call, impact: call, notification: call });
function deferred() { let resolve!: () => void; const promise = new Promise<void>(yes => { resolve = yes; }); return { promise, resolve }; }
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('restores lazy defaults after a temporary backend or silence before first use', () => {
  for (const temporary of [null, backend(vi.fn())]) {
    const call = vi.fn(); const resolve = vi.fn(() => backend(call));
    const lanes = createHapticLanes(resolve);
    const restore = lanes.install(temporary); restore(); restore(); lanes.fire('selection');
    expect(resolve).toHaveBeenCalledOnce(); expect(call).toHaveBeenCalledOnce();
  }
});
it('keeps distinct silence scopes and never resurrects an out-of-order retired backend', () => {
  const call = vi.fn(); const retired = vi.fn(); const lanes = createHapticLanes(() => backend(call));
  const first = lanes.install(null), second = lanes.install(null);
  first(); lanes.fire('selection'); expect(call).not.toHaveBeenCalled();
  second(); lanes.fire('selection'); expect(call).toHaveBeenCalledOnce();
  const a = lanes.install(backend(retired)), b = lanes.install(null);
  a(); b(); lanes.fire('selection'); expect(retired).not.toHaveBeenCalled(); expect(call).toHaveBeenCalledTimes(2);
});
it('releases a replaced lane immediately and ignores old settlements and queued taps', async () => {
  const old = deferred(), next = deferred();
  const oldCall = vi.fn(() => old.promise), nextCall = vi.fn(() => next.promise);
  const lanes = createHapticLanes(() => backend(oldCall));
  lanes.fire('selection'); lanes.fire('selection');
  const restore = lanes.install(backend(nextCall)); lanes.fire('selection');
  expect(nextCall).toHaveBeenCalledOnce(); old.resolve(); await flush(); expect(nextCall).toHaveBeenCalledOnce();
  restore(); next.resolve(); await flush(); expect(oldCall).toHaveBeenCalledOnce();
  lanes.fire('selection'); expect(oldCall).toHaveBeenCalledTimes(2);
});
it('silenced calls and old settlements cannot replay into a restored default', async () => {
  const old = deferred(); const call = vi.fn(() => old.promise); const lanes = createHapticLanes(() => backend(call));
  lanes.fire('selection'); lanes.fire('selection');
  const restore = lanes.install(null); lanes.fire('selection'); restore();
  old.resolve(); await flush(); expect(call).toHaveBeenCalledOnce();
  lanes.fire('selection'); expect(call).toHaveBeenCalledTimes(2);
});
it('expires a hung call after a second without replay and ignores a late settlement', async () => {
  const first = deferred(), second = deferred();
  const call = vi.fn().mockReturnValueOnce(first.promise).mockReturnValue(second.promise);
  const lanes = createHapticLanes(() => backend(call)); lanes.fire('selection'); lanes.fire('selection');
  await vi.advanceTimersByTimeAsync(1000); expect(call).toHaveBeenCalledOnce();
  lanes.fire('selection'); first.resolve(); await flush(); lanes.fire('selection');
  expect(call).toHaveBeenCalledTimes(2); second.resolve(); await flush(); expect(call).toHaveBeenCalledTimes(3);
});
it('contains resolver and thenable failures and recovers on the next cue', () => {
  const call = vi.fn(); const resolve = vi.fn().mockImplementationOnce(() => { throw Error('initializing'); }).mockReturnValue(backend(call));
  const lanes = createHapticLanes(resolve); expect(() => lanes.fire('selection')).not.toThrow(); lanes.fire('selection'); expect(call).toHaveBeenCalledOnce();
  for (const pending of [{ get then() { throw Error('accessor'); } }, { then() { throw Error('hookup'); } }]) {
    const bad = vi.fn(() => pending as unknown as Promise<void>); lanes.install(backend(bad));
    expect(() => { lanes.fire('selection'); lanes.fire('selection'); }).not.toThrow(); expect(bad).toHaveBeenCalledTimes(2);
  }
});
it('handles double settlements without freeing a newer flight', () => {
  let settle!: () => void; const pending = { then(yes: () => void) { settle = yes; } };
  const call = vi.fn(() => pending as unknown as Promise<void>); const lanes = createHapticLanes(() => backend(call));
  lanes.fire('selection'); const old = settle; old(); lanes.fire('selection'); old(); lanes.fire('selection'); expect(call).toHaveBeenCalledTimes(2);
});
it('drops queued requests across off/on even if the original promise later settles', async () => {
  const pending = deferred(); const call = vi.fn(() => pending.promise); const lanes = createHapticLanes(() => backend(call));
  lanes.fire('selection'); lanes.fire('selection'); setHapticsEnabled(false); setHapticsEnabled(true);
  pending.resolve(); await flush(); expect(call).toHaveBeenCalledOnce();
});
