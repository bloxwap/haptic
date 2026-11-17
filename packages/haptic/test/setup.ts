import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  Reflect.deleteProperty(globalThis, Symbol.for('@bloxwap/haptic/gate/v1'));
  Reflect.deleteProperty(globalThis, Symbol.for('@bloxwap/haptic/vibration/v1'));
});
