import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
import { spawnSync } from 'node:child_process';

const temporary = mkdtempSync(resolve('.snippet-check-'));
let count = 0;
try {
  for (const file of readdirSync('content/docs').filter(path => path.endsWith('.mdx'))) {
    const mdx = readFileSync(join('content/docs', file), 'utf8');
    for (const [, snippet] of mdx.matchAll(/```(?:tsx|ts)\n([\s\S]*?)```/g)) {
      writeFileSync(join(temporary, `snippet-${count++}.tsx`), `export {};\n${snippet}`);
    }
  }
  // tsrs by default; `--tsc` uses the regular TypeScript compiler (Windows and Intel Macs have no tsrs binary).
  const compiler = process.argv.includes('--tsc') ? [resolve(workspace, 'node_modules/typescript/bin/tsc')] : [resolve(workspace, 'node_modules/tsrs/bin/tsrs'), '--ignoreConfig'];
  const result = spawnSync('node', [...compiler, '--noEmit', '--strict', '--skipLibCheck', '--jsx', 'react-jsx', '--target', 'ES2020', '--module', 'ESNext', '--moduleResolution', 'Bundler', ...readdirSync(temporary).map(path => join(temporary, path))], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Documentation snippets failed:\n${result.stdout}\n${result.stderr}`);
  console.log(`Type-checked ${count} documentation snippets against the public package.`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
