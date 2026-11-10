import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export function parseJsonc(text) {
  let out = '';
  let quoted = false;
  let escape = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      out += character;
      if (escape) escape = false;
      else if (character === '\\') escape = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') {
      quoted = true;
      out += character;
      continue;
    }
    if (character === '/' && text[index + 1] === '/') {
      while (index < text.length && text[index] !== '\n') index += 1;
      out += '\n';
      continue;
    }
    if (character === ',' && /^\s*[}\]]/.test(text.slice(index + 1))) continue;
    out += character;
  }
  return JSON.parse(out);
}

function add(versions, name, version) {
  if (!versions.has(name)) versions.set(name, new Set());
  versions.get(name).add(version);
}

export function versionsFromPackageLock(lock) {
  const versions = new Map();
  for (const [path, meta] of Object.entries(lock.packages ?? {})) {
    if (!path.includes('node_modules') || meta.link || !meta.version) continue;
    add(versions, meta.name ?? path.split('node_modules/').pop(), meta.version);
  }
  return versions;
}

export function versionsFromBunLock(lock) {
  const versions = new Map();
  for (const value of Object.values(lock.packages ?? {})) {
    const spec = value?.[0];
    if (typeof spec !== 'string' || spec.includes('@workspace:')) continue;
    const at = spec.lastIndexOf('@');
    if (at <= 0) throw new Error(`Unreadable bun.lock package spec: ${spec}`);
    add(versions, spec.slice(0, at), spec.slice(at + 1));
  }
  return versions;
}

export function lockfileDiffs(npmLock, bunLock) {
  const npm = versionsFromPackageLock(npmLock);
  const bun = versionsFromBunLock(bunLock);
  const names = new Set([...npm.keys(), ...bun.keys()]);
  const diffs = [];
  for (const name of [...names].sort()) {
    const npmVersions = [...(npm.get(name) ?? [])].sort().join(', ');
    const bunVersions = [...(bun.get(name) ?? [])].sort().join(', ');
    if (npmVersions !== bunVersions) diffs.push(`${name}: package-lock.json [${npmVersions || 'missing'}] vs bun.lock [${bunVersions || 'missing'}]`);
  }
  return { packages: npm.size, diffs };
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const npmLock = JSON.parse(readFileSync(resolve(repoRoot, 'package-lock.json'), 'utf8'));
  const bunLock = parseJsonc(readFileSync(resolve(repoRoot, 'bun.lock'), 'utf8'));
  const { packages, diffs } = lockfileDiffs(npmLock, bunLock);
  if (diffs.length > 0) {
    console.error(diffs.join('\n'));
    throw new Error('bun.lock and package-lock.json resolve different versions.');
  }
  console.log(`bun.lock and package-lock.json resolve the same ${packages} packages.`);
}
