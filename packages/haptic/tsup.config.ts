import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/feedback.ts'],
  format: ['esm', 'cjs'],
  target: 'es2020',
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', 'web-haptics'],
});
