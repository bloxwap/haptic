import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const temporary = mkdtempSync(join(process.env.RUNNER_TEMP || tmpdir(), 'haptic-typecheck-parity-'));

function diagnostics(output) {
  return [...output.matchAll(/\((\d+),(\d+)\): error (TS\d+): (.*)$/gm)]
    .map(match => `${match[1]}:${match[2]} ${match[3]} ${match[4]}`);
}

function compile(binary) {
  const result = spawnSync(process.execPath, [binary, '--pretty', 'false', '-p', join(temporary, 'tsconfig.json')], {
    cwd: temporary,
    encoding: 'utf8',
  });
  return { status: result.status, diagnostics: diagnostics(`${result.stdout}\n${result.stderr}`) };
}

try {
  writeFileSync(join(temporary, 'bad.ts'), 'export const value: number = "no";\n');
  writeFileSync(join(temporary, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      strict: true,
      noEmit: true,
      types: [],
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'Bundler',
    },
    files: ['bad.ts'],
  }));
  const tsc = compile(resolve(root, 'node_modules/typescript/bin/tsc'));
  const tsrs = compile(resolve(root, 'node_modules/tsrs/bin/tsrs'));
  if (tsc.status === 0 || tsrs.status === 0) throw new Error('The planted type error must fail both tsc and tsrs.');
  if (tsc.diagnostics.length === 0 || tsrs.diagnostics.join('\n') !== tsc.diagnostics.join('\n')) {
    throw new Error(`tsc and tsrs disagree on the planted error.\ntsc: ${tsc.diagnostics.join(' | ')}\ntsrs: ${tsrs.diagnostics.join(' | ')}`);
  }
  console.log(`tsc and tsrs report the same planted error (${tsc.diagnostics.join('; ')}).`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
