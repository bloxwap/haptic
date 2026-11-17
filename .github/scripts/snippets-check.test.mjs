import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('the real documentation checker accepts complete examples and rejects broken original imports', () => {
  const temporary = mkdtempSync(resolve('apps/docs/.snippet-check-fixture-'));
  try {
    mkdirSync(join(temporary, 'content/docs'), { recursive: true });
    const check = source => {
      writeFileSync(join(temporary, 'content/docs/test.mdx'), '```tsx\n' + source + '\n```');
      return spawnSync(process.execPath, [resolve('apps/docs/scripts/check-snippets.mjs'), '--tsc'], { cwd: temporary, encoding: 'utf8' });
    };
    const valid = check("import { Haptic } from '@bloxwap/haptic';\nconst element = <Haptic><button>Test</button></Haptic>;");
    assert.equal(valid.status, 0, valid.stderr);
    const invalid = check("import { Haptic } from '@bloxwap/haptic/nonexistent';\nconst element = <Haptic><button>Test</button></Haptic>;");
    assert.notEqual(invalid.status, 0); assert.match(invalid.stderr, /nonexistent/);
    const incomplete = check('const element = <Haptic><button>Test</button></Haptic>;');
    assert.notEqual(incomplete.status, 0); assert.match(incomplete.stderr, /Cannot find name 'Haptic'/);
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
