import { describe, expect, it, vi } from 'vitest';
import observations from '../../../.github/planning/reference-observations.json';

describe('retained engine contract', () => {
  it.each(observations.presets)('matches measured $name vibration output', async ({ name, vibration }) => {
    const vibrate = vi.fn((_input: number | number[]) => true);
    vi.stubGlobal('navigator', { vibrate });
    vi.resetModules();
    const { WebHaptics } = await import('web-haptics');
    const engine = new WebHaptics();
    await engine.trigger(name);
    expect(vibrate.mock.calls.map(call => call[0])).toEqual(vibration);
    engine.destroy();
  });
});
