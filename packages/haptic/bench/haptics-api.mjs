// A/B benchmark for the cross-platform `haptics.*` API.
//
// Native: dist/native.js (expo-haptics and react-native stubbed) against the
// monorepo's ui-native lane scheduler, plus a no-lane direct-call control.
// Web: dist/index.js `haptics` against the monorepo's WebHaptics singleton and
// the documented `triggerHaptic` path, under jsdom with a stubbed Vibration API.
//
// These are JS dispatch costs on this host. They exclude the native bridge and
// Taptic Engine/vibrator latency, which only a physical device can measure.
//
//   npm run bench:api            (from packages/haptic; builds dist first)

import { build } from 'esbuild';
import { provenance } from './lib/provenance.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { PerformanceObserver, performance } from 'node:perf_hooks';
import { cpus, platform, release } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const out = `${cwd}bench/results`;
const source = provenance(cwd);
await mkdir(out, { recursive: true });

// Native backend stub: each call records itself; latency is controlled per scenario.
globalThis.__native = { calls: 0, latency: 'microtask' };
const stubPlugin = {
  name: 'native-stubs',
  setup(b) {
    b.onResolve({ filter: /^(expo-haptics|react-native)$/ }, args => ({ path: args.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({
      loader: 'js',
      contents: args.path === 'react-native'
        ? 'export const Platform = { OS: "ios" };'
        : `
          const settle = () => {
            const n = globalThis.__native; n.calls++;
            if (n.latency === 'microtask') return Promise.resolve();
            if (n.latency === 'never') return new Promise(() => {});
            return new Promise(resolve => setTimeout(resolve, n.latency));
          };
          export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' };
          export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };
          export const AndroidHaptics = undefined;
          export const selectionAsync = settle;
          export const impactAsync = settle;
          export const notificationAsync = settle;
          export const performAndroidHapticsAsync = settle;
        `,
    }));
  },
};

async function bundle(entry, name, external = []) {
  const file = `${out}/${name}.mjs`;
  await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', target: 'es2022', outfile: file, plugins: [stubPlugin], external, logLevel: 'silent' });
  return import(pathToFileURL(file).href);
}

const candidate = await bundle(`${cwd}dist/native.js`, 'native-candidate');
const baseline = await bundle(`${cwd}bench/baseline/ui-native-lanes.ts`, 'native-baseline');
const expo = await bundle(`${cwd}bench/baseline/expo-direct.mjs`, 'native-direct');
baseline.installHapticBackend({
  selection: () => expo.selectionAsync(),
  impact: () => expo.impactAsync(),
  notification: () => expo.notificationAsync(),
});

const subjects = {
  'candidate (@bloxwap/haptic/native)': candidate.haptics,
  'baseline (ui-native lanes)': baseline.haptics,
  'control (direct expo call, no lane)': { selection: () => { expo.selectionAsync().then(() => {}, () => {}); } },
};

let gcCount = 0;
new PerformanceObserver(list => { gcCount += list.getEntries().length; }).observe({ entryTypes: ['gc'] });

const rows = [];
function record(group, scenario, subject, values, extra = {}) {
  values.sort((a, b) => a - b);
  rows.push({ group, scenario, subject, median: values[Math.floor(values.length / 2)], p95: values[Math.ceil(values.length * 0.95) - 1], samples: values.length, ...extra });
}

const SAMPLES = 15;
const settle = () => new Promise(resolve => setImmediate(resolve));

async function measure(group, scenario, subject, operations, run) {
  for (let warm = 0; warm < 3; warm++) await run();
  const values = [];
  globalThis.gc?.();
  await settle();
  const gcBefore = gcCount;
  const callsBefore = globalThis.__native.calls;
  for (let index = 0; index < SAMPLES; index++) {
    const start = performance.now();
    await run();
    values.push(((performance.now() - start) * 1e6) / operations);
  }
  await settle();
  record(group, scenario, subject, values, {
    unit: 'ns/op',
    gcPer100k: ((gcCount - gcBefore) / (SAMPLES * operations)) * 1e5,
    bridgeCallsPerOp: (globalThis.__native.calls - callsBefore) / (SAMPLES * operations),
  });
}

// 1. Isolated taps: each tap lands on an idle lane and settles before the next.
for (const [name, api] of Object.entries(subjects)) {
  globalThis.__native.latency = 'microtask';
  const TAPS = 20000;
  await measure('native', 'isolated tap (fire + settle)', name, TAPS, async () => {
    for (let tap = 0; tap < TAPS; tap++) { api.selection(); await null; await null; }
  });
}

// 2. Burst on a busy lane: the native call is still in flight for every tap.
for (const [name, api] of Object.entries(subjects)) {
  if (name.startsWith('control')) continue; // Without a lane every tap is a new bridge call; see scenario 3.
  globalThis.__native.latency = 'never';
  const TAPS = 1_000_000;
  api.selection(); // Occupy the lane once; it never settles.
  await measure('native', 'burst tap on busy lane (collapse path)', name, TAPS, async () => {
    for (let tap = 0; tap < TAPS; tap++) api.selection();
  });
}

// 3. Realistic scroll-detent burst: 120 taps/s for one second, 12ms native round trip.
async function cadence(api) {
  const n = globalThis.__native;
  n.latency = 12;
  const before = n.calls;
  const start = performance.now();
  for (let tap = 0; tap < 120; tap++) {
    api.selection();
    await new Promise(resolve => setTimeout(resolve, 1000 / 120));
  }
  await new Promise(resolve => setTimeout(resolve, 50));
  return { calls: n.calls - before, elapsed: performance.now() - start };
}
const cadenceRows = [];
for (const [name, api] of Object.entries({
  'candidate (@bloxwap/haptic/native)': (await bundle(`${cwd}dist/native.js`, 'native-candidate-2')).haptics,
  'baseline (ui-native lanes)': (() => {
    // Fresh lane state; the busy-lane scenario left the earlier instance occupied.
    return null;
  })(),
  'control (direct expo call, no lane)': subjects['control (direct expo call, no lane)'],
})) {
  let target = api;
  if (!target) {
    const fresh = await bundle(`${cwd}bench/baseline/ui-native-lanes.ts`, 'native-baseline-2');
    fresh.installHapticBackend({ selection: () => expo.selectionAsync(), impact: () => expo.impactAsync(), notification: () => expo.notificationAsync() });
    target = fresh.haptics;
  }
  cadenceRows.push({ subject: name, ...(await cadence(target)) });
}

// 4. Web: jsdom + stubbed Vibration API, matching the existing bench worker setup.
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
let vibrations = 0;
const navigatorStub = { vibrate: () => { vibrations++; return true; }, userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/140', platform: 'Linux armv8l', maxTouchPoints: 5 };
for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: navigatorStub, HTMLElement: dom.window.HTMLElement, requestAnimationFrame: dom.window.requestAnimationFrame, cancelAnimationFrame: dom.window.cancelAnimationFrame })) {
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}
const web = await import(pathToFileURL(`${cwd}dist/index.js`).href);
const webBaseline = await bundle(`${cwd}bench/baseline/app-web-haptics.ts`, 'web-baseline');
const webSubjects = {
  'candidate haptics.selection()': () => web.haptics.selection(),
  'triggerHaptic("selection")': () => { void web.triggerHaptic('selection'); },
  'baseline WebHaptics singleton': () => webBaseline.haptics.selection(),
};
// Two rounds in opposite order expose JIT/order effects instead of hiding them in one number.
const webOrder = Object.entries(webSubjects);
for (const [round, order] of [[1, webOrder], [2, [...webOrder].reverse()]]) for (const [name, tap] of order) {
  const TAPS = 100_000;
  const before = vibrations;
  await measure('web', `tap dispatch (Vibration API), round ${round}`, name, TAPS, async () => {
    for (let index = 0; index < TAPS; index++) tap();
  });
  rows.at(-1).vibratePerOp = (vibrations - before) / ((SAMPLES + 3) * TAPS);
}

const fmt = (value, digits = 1) => (value === undefined ? '—' : value.toFixed(digits));
const lines = [
  `Environment: ${process.version}; ${platform()} ${release()}; ${cpus()[0]?.model}; ${source.commit}${source.dirty ? " (dirty worktree)" : ""}; source ${source.sourceDigest}; ${new Date().toISOString()}`,
  '',
  '| Group | Scenario | Subject | Median ns/op | p95 ns/op | GC events / 100k ops | Bridge calls / op |',
  '| --- | --- | --- | ---: | ---: | ---: | ---: |',
  ...rows.map(row => `| ${row.group} | ${row.scenario} | ${row.subject} | ${fmt(row.median)} | ${fmt(row.p95)} | ${fmt(row.gcPer100k, 2)} | ${row.group === 'native' ? fmt(row.bridgeCallsPerOp, 4) : '—'} |`),
  '',
  '| 120 taps at 120 Hz, 12 ms native round trip | Bridge calls | Elapsed ms |',
  '| --- | ---: | ---: |',
  ...cadenceRows.map(row => `| ${row.subject} | ${row.calls} | ${fmt(row.elapsed)} |`),
];
const markdown = lines.join('\n');
await writeFile(`${out}/haptics-api.json`, JSON.stringify({ source, rows, cadenceRows, markdown }, null, 2) + '\n');
console.log(markdown);
process.exit(0);
