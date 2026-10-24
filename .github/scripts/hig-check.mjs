import { readFileSync, readdirSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const version = '0.1.0';
const docs = JSON.parse(readFileSync('apps/docs/package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const packages = ['@bloxwap/hig-tokens', '@bloxwap/hig-contracts', '@bloxwap/hig-react'];
for (const name of packages) {
  assert.equal(docs.dependencies[name], version, `${name} must use the coordinated registry version`);
  const installed = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
  const entry = lock.packages[`node_modules/${name}`];
  assert.equal(installed.version, version, `${name} installed version drift`);
  assert.equal(entry.version, version, `${name} lockfile version drift`);
  assert.equal(entry.resolved, `https://registry.npmjs.org/${name}/-/${name.split('/')[1]}-${version}.tgz`, `${name} must resolve from npm`);
  assert.match(entry.integrity, /^sha512-/, `${name} needs registry integrity`);
}

// Web tokens ship no font binaries since hig#64; docs fonts come from @bloxwap/font only.
const tokenFonts = readdirSync('node_modules/@bloxwap/hig-tokens', { recursive: true }).filter(file => /\.(ttf|otf|woff2?)$/.test(file));
assert.deepEqual(tokenFonts, [], 'Installed @bloxwap/hig-tokens must not carry font binaries');

// Docs consume HIG through package imports; no copied distribution or local palette.
const css = readFileSync('apps/docs/app/global.css', 'utf8');
for (const entry of ['@bloxwap/hig-tokens/css', '@bloxwap/hig-react/css/base', '@bloxwap/hig-react/css']) assert(css.includes(`@import '${entry}'`), `global.css must import ${entry}`);
assert(!existsSync('apps/docs/styles/hig'), 'Copied HIG distributions are replaced by the package import');
for (const file of ['apps/docs/app/global.css', ...readdirSync('apps/docs/styles').map(file => `apps/docs/styles/${file}`)]) {
  const source = readFileSync(file, 'utf8');
  assert(!/#[0-9a-f]{3,8}(?![\w-])|\b(?:rgb|hsl|oklch)a?\(/i.test(source), `Local palette literals are forbidden: ${file}`);
  assert(!/--hig-[\w-]+\s*:/.test(source), `HIG tokens are package-owned; do not redefine them: ${file}`);
}
console.log(`Verified ${packages.length} HIG ${version} registry packages, lockfile integrity, CSS imports and palette ownership`);
