import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Record both the worktree being built and the actual distributed bytes measured. */
export function provenance(cwd) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  const root = git('rev-parse', '--show-toplevel');
  const files = git('-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
  const relevant = files.filter(path => ['src', 'bench', 'scripts'].some(directory => path.startsWith(`packages/haptic/${directory}/`)) ||
    ['package.json', 'package-lock.json', 'bun.lock', '.npmrc', 'packages/haptic/.npmrc', 'packages/haptic/package.json', 'packages/haptic/tsup.config.ts', 'packages/haptic/tsconfig.json'].includes(path));
  const hash = createHash('sha256');
  for (const path of [...new Set(relevant)].sort()) {
    hash.update(path + '\0');
    hash.update(existsSync(join(root, path)) ? readFileSync(join(root, path)) : '<deleted>');
    hash.update('\0');
  }
  const artifacts = {};
  const dist = join(root, 'packages/haptic/dist');
  for (const path of readdirSync(dist).filter(path => /\.(?:js|cjs)$/.test(path)).sort()) {
    artifacts[path] = createHash('sha256').update(readFileSync(join(dist, path))).digest('hex');
  }
  return { commit: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain', '--untracked-files=all') !== '', sourceDigest: hash.digest('hex'), artifacts };
}
