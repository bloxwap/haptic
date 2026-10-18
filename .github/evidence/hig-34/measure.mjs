// usage: node .github/evidence/hig-34/measure.mjs <repoDir> <outDir> <label>
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
const [repo, out, label] = process.argv.slice(2);
const files = readdirSync(out, { recursive: true }).map(f => join(out, f)).filter(f => statSync(f).isFile());
const sum = (list, gz = false) => list.reduce((n, f) => n + (gz ? gzipSync(readFileSync(f)).length : statSync(f).size), 0);
const css = files.filter(f => f.endsWith('.css')), js = files.filter(f => f.endsWith('.js'));
const fonts = files.filter(f => /\.(woff2?|ttf|otf)$/.test(f));
const lock = JSON.parse(readFileSync(join(repo, 'package-lock.json'), 'utf8'));
const docsPkg = JSON.parse(readFileSync(join(repo, 'apps/docs/package.json'), 'utf8'));
const srcFiles = ['app', 'components', 'lib', 'styles'].flatMap(d => { try { return readdirSync(join(repo, 'apps/docs', d), { recursive: true }).map(f => join(repo, 'apps/docs', d, f)).filter(f => statSync(f).isFile()); } catch { return []; } });
const srcCss = srcFiles.filter(f => f.endsWith('.css'));
const lines = f => readFileSync(f, 'utf8').split('\n').length;
console.log(JSON.stringify({
  label,
  exportBytes: sum(files), exportFiles: files.length,
  cssBytes: sum(css), cssGzipBytes: sum(css, true), cssFiles: css.length,
  jsBytes: sum(js), jsGzipBytes: sum(js, true),
  fontBytes: sum(fonts), fontFiles: fonts.length,
  sourceCssFiles: srcCss.map(f => f.slice(repo.length + 1)), sourceCssBytes: sum(srcCss), sourceCssLines: srcCss.reduce((n, f) => n + lines(f), 0),
  docsDirectDependencies: Object.keys(docsPkg.dependencies ?? {}).length, docsDirectDevDependencies: Object.keys(docsPkg.devDependencies ?? {}).length,
  lockfilePackages: Object.keys(lock.packages).filter(k => k.startsWith('node_modules/') || k.includes('/node_modules/')).length,
}, null, 2));
