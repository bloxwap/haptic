import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const css = readFileSync('apps/docs/styles/hig/tokens.css');
assert.equal(createHash('sha256').update(css).digest('hex'), '1c60086af561070fdc1ee6056d6bc43bd8eed78614c318d466ee3850dc317609', 'HIG distribution drift: replace only from a reviewed upstream commit');
assert(!readFileSync('apps/docs/styles/tokens.css', 'utf8').includes('#'), 'Local palette copies are forbidden');
console.log('Pinned HIG distribution and palette ownership verified');
