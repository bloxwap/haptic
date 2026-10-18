import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const temporary = mkdtempSync(resolve('.snippet-check-'));
let count = 0;
try {
  for (const file of readdirSync('content/docs').filter(path => path.endsWith('.mdx'))) {
    const mdx = readFileSync(join('content/docs', file), 'utf8');
    for (const [, snippet] of mdx.matchAll(/```(?:tsx|ts)\n([\s\S]*?)```/g)) {
      const source = snippet.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
      const prelude = `import { createHapticAdapter } from '@bloxwap/haptic/feedback';\nimport { useRef } from 'react';\nimport { Haptic, HapticTarget, useIOSNativeHaptics, isIOSWebKitWithoutVibration, canTriggerHaptic, triggerHaptic, type HapticCapability, type HapticTriggerResult, type HapticTargetProps, type HapticInput, type HapticPattern, type HapticPreset, type TriggerOptions, type Vibration, type WebHapticsOptions } from '@bloxwap/haptic';\nconst save = () => {};\n`;
      writeFileSync(join(temporary, `snippet-${count++}.tsx`), prelude + source);
    }
  }
  const result = spawnSync('node', [resolve('../../node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--jsx', 'react-jsx', '--target', 'ES2020', '--module', 'ESNext', '--moduleResolution', 'Bundler', ...readdirSync(temporary).map(path => join(temporary, path))], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Documentation snippets failed:\n${result.stdout}\n${result.stderr}`);
  console.log(`Type-checked ${count} documentation snippets against the public package.`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
