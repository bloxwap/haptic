import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';

const FULL_BUDGET = 5632;
const IMPERATIVE_BUDGET = 1536;

function inputPaths(metafile) {
  return Object.values(metafile.outputs).flatMap(output => Object.keys(output.inputs));
}

async function bundle(contents, external = []) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), sourcefile: 'size-entry.js' },
    bundle: true,
    minify: true,
    write: false,
    metafile: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    external,
    logLevel: 'silent',
  });
  return { gzip: gzipSync(result.outputFiles[0].contents).byteLength, inputs: inputPaths(result.metafile) };
}

const full = await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  write: false,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  external: ['react', 'react-dom'],
});
const fullBytes = gzipSync(full.outputFiles[0].contents).byteLength;
console.log(`Browser bundle including web-haptics, excluding React: ${fullBytes} gzip bytes (budget ${FULL_BUDGET}).`);
if (fullBytes > FULL_BUDGET) throw new Error('Haptic exceeds its measured bundle-size budget.');

async function assertImperative(name) {
  // React stays external, matching a consumer bundle. web-haptics must be shaken out, not ignored.
  const result = await bundle(`import { ${name} } from './dist/index.js'; console.log(${name});`, ['react', 'react/*', 'react-dom']);
  const engine = result.inputs.filter(path => path.includes('web-haptics/'));
  console.log(`${name}: ${result.gzip} gzip bytes (budget ${IMPERATIVE_BUDGET}); web-haptics inputs: ${engine.length}.`);
  if (engine.length > 0) throw new Error(`${name} bundles web-haptics: ${engine.join(', ')}`);
  if (result.gzip > IMPERATIVE_BUDGET) throw new Error(`${name} exceeds its ${IMPERATIVE_BUDGET} byte gzip budget (${result.gzip}).`);
}

await assertImperative('triggerHaptic');
await assertImperative('canTriggerHaptic');

const feedback = await bundle(`import { createHapticAdapter } from './dist/feedback.js'; console.log(createHapticAdapter);`);
const forbidden = feedback.inputs.filter(path => path.includes('web-haptics/') || path.includes('/react/') || path.includes('/react-dom/'));
console.log(`createHapticAdapter: ${feedback.gzip} gzip bytes; forbidden inputs: ${forbidden.length}.`);
if (forbidden.length > 0) throw new Error(`@bloxwap/haptic/feedback bundles a forbidden dependency: ${forbidden.join(', ')}`);
