import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { provenance } from './provenance.mjs';

test('benchmark provenance distinguishes clean commits, dirty/untracked source and changed build artifacts', () => {
  const root = mkdtempSync(join(tmpdir(), 'haptic-provenance-'));
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
    mkdirSync(join(root, 'packages/haptic/src'), { recursive: true });
    mkdirSync(join(root, 'packages/haptic/dist'));
    writeFileSync(join(root, '.gitignore'), 'dist/\n');
    writeFileSync(join(root, 'packages/haptic/src/index.ts'), 'original');
    writeFileSync(join(root, 'packages/haptic/dist/index.js'), 'build one');
    git('init'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture');
    const clean = provenance(root); assert.equal(clean.dirty, false);
    writeFileSync(join(root, 'packages/haptic/src/index.ts'), 'modified');
    const dirty = provenance(root); assert.equal(dirty.dirty, true); assert.equal(dirty.commit, clean.commit); assert.notEqual(dirty.sourceDigest, clean.sourceDigest);
    writeFileSync(join(root, 'packages/haptic/src/new.ts'), 'untracked');
    assert.notEqual(provenance(root).sourceDigest, dirty.sourceDigest);
    const beforeHarness = provenance(root);
    mkdirSync(join(root, 'packages/haptic/bench'));
    writeFileSync(join(root, 'packages/haptic/bench/run.mjs'), 'changed measurement harness');
    assert.notEqual(provenance(root).sourceDigest, beforeHarness.sourceDigest);
    writeFileSync(join(root, 'packages/haptic/dist/index.js'), 'build two');
    assert.notDeepEqual(provenance(root).artifacts, clean.artifacts);
    rmSync(join(root, 'packages/haptic/src/index.ts')); assert.notEqual(provenance(root).sourceDigest, dirty.sourceDigest);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
