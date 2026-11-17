import { expect, it, vi } from 'vitest';
import { vibrationPattern, triggerHaptic } from '../src/trigger';
import type { HapticInput } from '../src';

it('keeps adjacent full-strength events on and silent events off', () => {
  expect(vibrationPattern([{ duration: 10, intensity: 1 }, { duration: 20, intensity: 1 }])).toEqual([30]);
  expect(vibrationPattern([{ duration: 10, intensity: 1 }, { duration: 20, intensity: 0 }])).toEqual([10, 20]);
  expect(vibrationPattern([10, 0, 20], { intensity: 1 })).toEqual([30]);
});
it('preserves the timeline for every combination of adjacent silent and full-strength events', () => {
  for (let bits = 0; bits < 16; bits++) {
    const events = Array.from({ length: 4 }, (_, i) => ({ duration: 3, delay: i % 2, intensity: (bits >> i) & 1 }));
    const expected = events.flatMap(event => [...Array(event.delay).fill(false), ...Array(event.duration).fill(Boolean(event.intensity))]);
    const encoded = vibrationPattern(events)!;
    const actual = encoded.flatMap((ms, index) => Array(ms).fill(index % 2 === 0));
    expect(actual).toEqual(expected);
  }
});
it('rounds submillisecond input without inventing longer pulses and merges zero-length pauses', () => {
  expect(vibrationPattern(0.5)).toEqual([]);
  expect(vibrationPattern(41, { intensity: 0.99 })).toEqual([41]);
  expect(vibrationPattern([{ duration: 10, delay: 0.9, intensity: 1 }])).toEqual([10]);
});
it.each([
  Array(129).fill(1), Array(65).fill({ duration: 1 }),
  [{ duration: 1, delay: Number.MAX_VALUE }], [{ duration: 1, delay: 10000 }],
  Array(55).fill({ duration: 182 }),
  [...Array(51).fill({ duration: 182 }), { duration: 20 }, { duration: 10, intensity: 1 }, { duration: 30, intensity: 0 }, { duration: 10, intensity: 1 }],
  [10, NaN],
].map(input => ({ input })))('rejects oversized or invalid input before requesting vibration (%#)', async ({ input }) => {
  const vibrate = vi.fn(); vi.stubGlobal('navigator', { vibrate });
  await expect(triggerHaptic(input as HapticInput)).resolves.toMatchObject({ delivered: false, reason: 'invalid-input' });
  expect(vibrate).not.toHaveBeenCalled();
});
it('accepts both maximum event forms and the ten-second total boundary', () => {
  expect(vibrationPattern(Array(64).fill({ duration: 1, intensity: 1 }))).toEqual([64]);
  expect(vibrationPattern(Array(128).fill(1), { intensity: 1 })).not.toBeNull();
  expect(vibrationPattern([{ delay: 9000, duration: 1000, intensity: 1 }])).toEqual([0, 9000, 1000]);
});
