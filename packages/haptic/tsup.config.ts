import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['esm', 'cjs'],
  target: 'es2020',
  dts: true,
  // The build script empties dist once; the two configs run concurrently.
  clean: false,
  sourcemap: true,
  splitting: false,
  external: ['react', 'react-dom', 'web-haptics', 'expo-haptics', 'react-native'],
};

// Separate configs keep every entry and declaration file self-contained: web
// apps load index, native apps load native, and no hashed chunk is shared.
export default defineConfig([
  { ...shared, entry: ['src/index.ts', 'src/feedback.ts'] },
  { ...shared, entry: ['src/native.ts'] },
]);
