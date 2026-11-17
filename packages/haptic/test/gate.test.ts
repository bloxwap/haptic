import { expect, it, vi } from 'vitest';
import { hapticsEnabled, setHapticsEnabled, subscribeHapticsEnabled } from '../src/gate';

it('shares the gate between independently evaluated modules', async () => {
  const original = await import('../src/gate'); vi.resetModules(); const other = await import('../src/gate');
  const seen = vi.fn(); const unsubscribe = other.subscribeHapticsEnabled(seen);
  original.setHapticsEnabled(false); expect(other.hapticsEnabled()).toBe(false); expect(seen).toHaveBeenCalledExactlyOnceWith(false);
  unsubscribe();
});
it('queues nested changes and keeps notification arguments consistent with the readable state', () => {
  const seen: boolean[] = [];
  subscribeHapticsEnabled(on => { if (!on) setHapticsEnabled(true); });
  subscribeHapticsEnabled(on => { expect(hapticsEnabled()).toBe(on); seen.push(on); });
  setHapticsEnabled(false); expect(seen).toEqual([false, true]); expect(hapticsEnabled()).toBe(true);
});
it('uses a subscription snapshot and skips listeners removed before their turn', () => {
  const removed = vi.fn(), added = vi.fn(); let unsubscribe = () => {};
  subscribeHapticsEnabled(() => { unsubscribe(); subscribeHapticsEnabled(added); });
  unsubscribe = subscribeHapticsEnabled(removed);
  setHapticsEnabled(false); expect(removed).not.toHaveBeenCalled(); expect(added).not.toHaveBeenCalled();
  setHapticsEnabled(true); expect(added).toHaveBeenCalledExactlyOnceWith(true);
});
