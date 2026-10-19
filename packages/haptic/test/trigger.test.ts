import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { canTriggerHaptic, triggerHaptic, type HapticInput, type TriggerOptions } from '../src';
import observations from '../../../.github/planning/reference-observations.json';

describe('HIG injected backend contract', () => {
  it('exports enumerable canTriggerHaptic and triggerHaptic from the public entry', async () => {
    const api = await import('../src');
    expect('canTriggerHaptic' in api).toBe(true);
    expect('triggerHaptic' in api).toBe(true);
    expect(api.canTriggerHaptic).toBeTypeOf('function');
    expect(api.triggerHaptic).toBeTypeOf('function');
  });

  it('publishes the main and feedback entries that packed consumers import', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(Object.keys(manifest.exports).sort()).toEqual(['.', './feedback', './package.json']);
    expect(manifest.exports['.']).toEqual({
      import: { types: './dist/index.d.ts', default: './dist/index.js' },
      require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
    });
  });
});

function browser(overrides: object = {}) {
  const vibrate = vi.fn(() => true);
  vi.stubGlobal('navigator', { vibrate, ...overrides });
  return vibrate;
}

describe('imperative capability', () => {
  it('probes without feedback or DOM and detects changes after import', async () => {
    const html = document.body.innerHTML;
    browser({ vibrate: undefined, platform: 'Linux', userAgent: 'Chrome' });
    expect(canTriggerHaptic()).toEqual({ available: false, mechanism: 'none', observed: false, reason: 'vibration-unavailable' });
    const vibrate = browser();
    expect(canTriggerHaptic()).toEqual({ available: true, mechanism: 'browser-vibration', observed: false });
    expect(vibrate).not.toHaveBeenCalled();
    await triggerHaptic();
    expect(vibrate).toHaveBeenCalledOnce();
    expect(document.body.innerHTML).toBe(html);
  });

  it('requires a visible page and browser sticky activation where exposed', async () => {
    const vibrate = browser({ userActivation: { hasBeenActive: false, isActive: false } });
    expect(canTriggerHaptic().reason).toBe('user-activation-required');
    await triggerHaptic();
    expect(vibrate).not.toHaveBeenCalled();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    expect(canTriggerHaptic().reason).toBe('document-hidden');
    await expect(triggerHaptic()).resolves.toMatchObject({ delivered: false, reason: 'document-hidden' });
    browser({ userActivation: { hasBeenActive: true, isActive: false } });
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    expect(canTriggerHaptic().available).toBe(true);
  });

  it.each([undefined, false, true])('never advertises imperative iOS ticks with activation %s', async active => {
    browser({ vibrate: undefined, platform: 'iPhone', userAgent: 'AppleWebKit', userActivation: active === undefined ? undefined : { isActive: active } });
    const before = document.body.innerHTML;
    const reason = active ? 'trusted-physical-tap-required' : 'user-activation-required';
    expect(canTriggerHaptic()).toEqual({ available: false, mechanism: 'none', observed: false, reason });
    await expect(triggerHaptic('success')).resolves.toEqual({ delivered: false, mechanism: 'none', reason });
    expect(document.body.innerHTML).toBe(before);
  });

  it('prefers vibration over Apple identity and tolerates absent navigator', async () => {
    browser({ platform: 'MacIntel', userAgent: 'AppleWebKit', maxTouchPoints: 5 });
    expect(canTriggerHaptic().mechanism).toBe('browser-vibration');
    vi.stubGlobal('navigator', undefined);
    expect(canTriggerHaptic().reason).toBe('browser-unavailable');
    await expect(triggerHaptic()).resolves.toMatchObject({ delivered: false, reason: 'browser-unavailable' });
  });
});

describe('imperative vibration', () => {
  it.each(observations.presets)('matches the measured $name component request', async ({ name, vibration }) => {
    const vibrate = browser();
    await expect(triggerHaptic(name)).resolves.toEqual({ delivered: true, mechanism: 'browser-vibration' });
    expect(vibrate).toHaveBeenCalledExactlyOnceWith(vibration[0]);
  });

  const forms: [HapticInput, TriggerOptions?][] = [
    [45], [25, { intensity: 1 }], [2, { intensity: 0.25 }], [1], [20, { intensity: 0.5 }], [2000],
    [[8, 60, 20]], [[40, 20, 10], { intensity: 0.7 }],
    [[{ duration: 40, delay: 10, intensity: 1 }, { duration: 30, delay: 8, intensity: 0.3 }]],
    [[{ duration: 20 }, { duration: 10, delay: 5 }]],
    [{ pattern: [{ duration: 25, intensity: 0 }, { duration: 5, delay: 10, intensity: 1 }] }],
    [[{ duration: 20, delay: 10 }, { duration: 15, intensity: 0 }]],
    [[{ duration: 10, intensity: 1 }, { duration: 20, intensity: 0 }]],
    [[{ duration: 0, intensity: 0 }, { duration: 5, intensity: 2 }]],
  ];
  it.each(forms.map(([input, options]) => ({ input, options })))('preserves engine output for $input / $options', async ({ input, options }) => {
    const vibrate = browser();
    vi.resetModules();
    const { WebHaptics } = await import('web-haptics');
    // Its support flag is captured at module evaluation, before this test's navigator.
    const supported = WebHaptics.isSupported;
    Reflect.set(WebHaptics, 'isSupported', true);
    const engine = new WebHaptics();
    try {
      await engine.trigger(input, options);
      expect(vibrate).toHaveBeenCalledOnce();
      const expected = vibrate.mock.calls[0];
      vibrate.mockClear();
      await triggerHaptic(input, options);
      expect(vibrate.mock.calls).toEqual([expected]);
    } finally {
      engine.destroy();
      Reflect.set(WebHaptics, 'isSupported', supported);
    }
  });

  it('requests the default synchronously and preserves frozen input', async () => {
    const vibrate = browser();
    const result = triggerHaptic();
    expect(vibrate).toHaveBeenCalledExactlyOnceWith([2, 6]);
    await expect(result).resolves.toMatchObject({ delivered: true });
    const input = Object.freeze({ pattern: Object.freeze([Object.freeze({ duration: 2000, intensity: 1 })]) });
    await triggerHaptic(input as unknown as HapticInput);
    expect(vibrate).toHaveBeenLastCalledWith([1000]);
    expect(input.pattern[0].duration).toBe(2000);
  });

  it.each([[], 0, { pattern: [] }, [{ duration: 20, intensity: -1 }]])('does not report silent input %j as delivered', async input => {
    const vibrate = browser();
    await expect(triggerHaptic(input)).resolves.toEqual({ delivered: false, mechanism: 'none', reason: 'empty-pattern' });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it.each([
    'missing', '__proto__', 'toString', null, {}, { pattern: 5 }, [-1], [NaN],
    [{ duration: -1 }], [{ duration: 5, delay: -1 }], [{ duration: 5, intensity: NaN }],
    [{ duration: 5, delay: Infinity }], [null], [1, { duration: 5 }], Infinity,
  ])('contains malformed input %j', async input => {
    const vibrate = browser();
    await expect(triggerHaptic(input as HapticInput)).resolves.toEqual({ delivered: false, mechanism: 'none', reason: 'invalid-input' });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('returns rejected and thrown vibration requests without rejecting its promise', async () => {
    const vibrate = browser();
    vibrate.mockReturnValueOnce(false).mockImplementationOnce(() => { throw Error('unavailable'); });
    await expect(triggerHaptic()).resolves.toEqual({ delivered: false, mechanism: 'none', reason: 'vibration-rejected' });
    await expect(triggerHaptic()).resolves.toEqual({ delivered: false, mechanism: 'none', reason: 'vibration-error' });
    await expect(triggerHaptic(20, { intensity: NaN })).resolves.toMatchObject({ reason: 'invalid-input' });
  });
});
