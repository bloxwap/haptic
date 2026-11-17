import { describe, expect, it, vi } from 'vitest';

async function load() {
  vi.resetModules();
  return import('../src');
}

describe('web haptics object', () => {
  it('vibrates each cue with its compiled preset and reuses the compiled array', async () => {
    const vibrate = vi.fn((_pattern: number[]) => true);
    vi.stubGlobal('navigator', { vibrate });
    const { haptics, useHaptics, triggerHaptic } = await load();
    expect(useHaptics()).toBe(haptics);
    haptics.selection(); haptics.selection();
    haptics.light(); haptics.medium(); haptics.heavy(); haptics.success(); haptics.warning(); haptics.error();
    expect(vibrate).toHaveBeenCalledTimes(8);
    expect(vibrate.mock.calls[0][0]).toBe(vibrate.mock.calls[1][0]);
    // Same output as the documented imperative API for every cue.
    const reference = vi.fn((_pattern: number[]) => true);
    vi.stubGlobal('navigator', { vibrate: reference });
    for (const cue of ['selection', 'selection', 'light', 'medium', 'heavy', 'success', 'warning', 'error'] as const) await triggerHaptic(cue);
    expect(vibrate.mock.calls).toEqual(reference.mock.calls);
  });

  it('does nothing when disabled, unavailable, or before user activation', async () => {
    const vibrate = vi.fn(() => true);
    const { haptics, setHapticsEnabled } = await load();
    vi.stubGlobal('navigator', { vibrate });
    setHapticsEnabled(false);
    haptics.success();
    setHapticsEnabled(true);
    vi.stubGlobal('navigator', { vibrate, userActivation: { hasBeenActive: false, isActive: false } });
    haptics.success();
    vi.stubGlobal('navigator', { platform: 'iPhone', userAgent: 'AppleWebKit', maxTouchPoints: 5 });
    haptics.success();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('is a no-op without a navigator, as during server rendering', async () => {
    const { haptics } = await load();
    vi.stubGlobal('navigator', undefined);
    expect(() => haptics.selection()).not.toThrow();
  });

  it('swallows Vibration API failures', async () => {
    vi.stubGlobal('navigator', { vibrate: () => { throw new Error('blocked'); } });
    const { haptics } = await load();
    expect(() => haptics.heavy()).not.toThrow();
  });
});
