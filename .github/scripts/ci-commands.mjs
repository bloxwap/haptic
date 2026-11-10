import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const workflows = {
  'tests.yml': readFileSync(resolve(root, '.github/workflows/tests.yml'), 'utf8'),
  'docs.yml': readFileSync(resolve(root, '.github/workflows/docs.yml'), 'utf8'),
  'publish_npm.yml': readFileSync(resolve(root, '.github/workflows/publish_npm.yml'), 'utf8'),
};

function must(name, needle) {
  if (!workflows[name].includes(needle)) throw new Error(`${name} must run ${needle}.`);
}

must('tests.yml', 'run test:matrix');
must('publish_npm.yml', 'run test:matrix');
must('tests.yml', 'run typecheck:tsc');
must('publish_npm.yml', 'run typecheck:tsc');
must('tests.yml', 'run typecheck:parity');
must('publish_npm.yml', 'run typecheck:parity');
must('docs.yml', 'run docs:check:tsc');
must('publish_npm.yml', 'run docs:check:tsc');
console.log('CI runs the React matrix, tsc fallback, typecheck parity, and docs tsc check.');
