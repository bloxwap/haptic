import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'expo-haptics': fileURLToPath(new URL('test/stubs/expo-haptics.ts', import.meta.url)),
      'react-native': fileURLToPath(new URL('test/stubs/react-native.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
