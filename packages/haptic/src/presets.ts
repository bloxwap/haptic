import type { defaultPatterns as WebHapticsDefaultPatterns } from 'web-haptics';

// Keep this literal in sync with web-haptics; test/presets.test.ts checks for drift.
export const defaultPatterns = {
  success: { pattern: [{ duration: 30, intensity: 0.5 }, { delay: 60, duration: 40, intensity: 1 }] },
  warning: { pattern: [{ duration: 40, intensity: 0.8 }, { delay: 100, duration: 40, intensity: 0.6 }] },
  error: { pattern: [{ duration: 40, intensity: 0.9 }, { delay: 40, duration: 40, intensity: 0.9 }, { delay: 40, duration: 40, intensity: 0.9 }] },
  light: { pattern: [{ duration: 15, intensity: 0.4 }] },
  medium: { pattern: [{ duration: 25, intensity: 0.7 }] },
  heavy: { pattern: [{ duration: 35, intensity: 1 }] },
  soft: { pattern: [{ duration: 40, intensity: 0.5 }] },
  rigid: { pattern: [{ duration: 10, intensity: 1 }] },
  selection: { pattern: [{ duration: 8, intensity: 0.3 }] },
  nudge: { pattern: [{ duration: 80, intensity: 0.8 }, { delay: 80, duration: 50, intensity: 0.3 }] },
  buzz: { pattern: [{ duration: 1000, intensity: 1 }] },
} satisfies typeof WebHapticsDefaultPatterns;
