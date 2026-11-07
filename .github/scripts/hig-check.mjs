import { readFileSync, readdirSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const version = '0.2.0';
const name = '@bloxwap/hig';
const docs = JSON.parse(readFileSync('apps/docs/package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
assert.equal(docs.dependencies[name], version, `${name} must use the coordinated registry version`);
const installed = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
const entry = lock.packages[`node_modules/${name}`];
assert.equal(installed.version, version, `${name} installed version drift`);
assert.equal(entry.version, version, `${name} lockfile version drift`);
assert.equal(entry.resolved, `https://registry.npmjs.org/${name}/-/${name.split('/')[1]}-${version}.tgz`, `${name} must resolve from npm`);
assert.match(entry.integrity, /^sha512-/, `${name} needs registry integrity`);

const retired = ['@bloxwap/hig-tokens', '@bloxwap/hig-contracts', '@bloxwap/hig-react', '@bloxwap/hig-native', '@bloxwap/hig-chart', '@bloxwap/hig-feedback', '@bloxwap/hig-native-fonts', '@bloxwap/hig-og-fonts'];
for (const retiredName of retired) {
  assert.equal(docs.dependencies[retiredName], undefined, `${retiredName} is unpublished; depend on ${name}`);
  assert.equal(lock.packages[`node_modules/${retiredName}`], undefined, `${retiredName} must not remain in the lockfile`);
}

// Web tokens ship no font binaries since hig#64; docs fonts come from @bloxwap/font only.
// Native and OG faces live beside tokens inside the unified package and are not imported here.
const tokenFonts = readdirSync(`node_modules/${name}/tokens`, { recursive: true }).filter(file => /\.(ttf|otf|woff2?)$/.test(file));
assert.deepEqual(tokenFonts, [], 'Installed @bloxwap/hig/tokens must not carry font binaries');

// Docs consume HIG through package imports; no copied distribution or local palette.
const css = readFileSync('apps/docs/app/global.css', 'utf8');
for (const cssEntry of ['@bloxwap/hig/tokens/css', '@bloxwap/hig/react/css/base', '@bloxwap/hig/react/css']) assert(css.includes(`@import '${cssEntry}'`), `global.css must import ${cssEntry}`);
assert(!existsSync('apps/docs/styles/hig'), 'Copied HIG distributions are replaced by the package import');
for (const file of ['apps/docs/app/global.css', ...readdirSync('apps/docs/styles').map(file => `apps/docs/styles/${file}`)]) {
  const source = readFileSync(file, 'utf8');
  assert(!/#[0-9a-f]{3,8}(?![\w-])|\b(?:rgb|hsl|oklch)a?\(/i.test(source), `Local palette literals are forbidden: ${file}`);
  assert(!/--hig-[\w-]+\s*:/.test(source), `HIG tokens are package-owned; do not redefine them: ${file}`);
}
console.log(`Verified ${name} ${version} from the registry, lockfile integrity, CSS imports and palette ownership`);
