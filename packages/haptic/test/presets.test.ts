import { expect, it } from 'vitest';
import { defaultPatterns as upstreamPatterns } from 'web-haptics';
import { defaultPatterns } from '../src/presets';

it('keeps local presets identical to web-haptics defaults', () => {
  expect(defaultPatterns).toEqual(upstreamPatterns);
});
