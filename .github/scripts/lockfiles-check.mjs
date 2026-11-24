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

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const bunLock = parseJsonc(readFileSync(resolve(repoRoot, 'bun.lock'), 'utf8'));
  const versions = versionsFromBunLock(bunLock);
  if (versions.size === 0) throw new Error('bun.lock does not resolve any packages.');
  const pairs = [...versions.values()].reduce((n, set) => n + set.size, 0);
  console.log(`bun.lock resolves ${versions.size} packages (${pairs} name/version pairs).`);
}
