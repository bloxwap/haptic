import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

// Vendored HIG candidate tarballs must match the reviewed dry-run output.
const vendor = 'vendor/bloxwap-hig';
const sums = readFileSync(`${vendor}/SHA256SUMS`, 'utf8').trim().split('\n').map(line => line.split(/\s+/));
assert.deepEqual(sums.map(([, file]) => file).sort(), readdirSync(vendor).filter(file => file.endsWith('.tgz')).sort(), 'Every vendored HIG tarball needs a reviewed checksum');
for (const [sum, file] of sums) assert.equal(createHash('sha256').update(readFileSync(`${vendor}/${file}`)).digest('hex'), sum, `HIG tarball drift: ${file}`);

// Web tokens ship no font binaries since hig#64; docs fonts come from @bloxwap/font only.
const tokenFonts = readdirSync('node_modules/@bloxwap/hig-tokens', { recursive: true }).filter(file => /\.(ttf|otf|woff2?)$/.test(file));
assert.deepEqual(tokenFonts, [], 'Installed @bloxwap/hig-tokens must not carry font binaries');

// Docs consume HIG through package imports; no copied distribution or local palette.
const css = readFileSync('apps/docs/app/global.css', 'utf8');
for (const entry of ['@bloxwap/hig-tokens/css', '@bloxwap/hig-react/css']) assert(css.includes(`@import '${entry}'`), `global.css must import ${entry}`);
assert(!existsSync('apps/docs/styles/hig'), 'Copied HIG distributions are replaced by the package import');
for (const file of ['apps/docs/app/global.css', ...readdirSync('apps/docs/styles').map(file => `apps/docs/styles/${file}`)]) {
  const source = readFileSync(file, 'utf8');
  assert(!/#[0-9a-f]{3,8}(?![\w-])|\b(?:rgb|hsl|oklch)a?\(/i.test(source), `Local palette literals are forbidden: ${file}`);
  assert(!/--hig-[\w-]+\s*:/.test(source), `HIG tokens are package-owned; do not redefine them: ${file}`);
}
console.log(`Verified ${sums.length} vendored HIG tarballs, package CSS imports and palette ownership`);
