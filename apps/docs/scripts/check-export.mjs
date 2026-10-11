import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
for (const license of ['bloxwap-font-OFL.txt', 'space-grotesk-OFL.txt']) {
  if (!existsSync(`out/licenses/${license}`)) throw new Error(`Static export is missing font license: ${license}`);
}
for (const path of ['index.html', 'docs/index.html', 'docs/api/index.html', 'docs/patterns/index.html', 'docs/platforms/index.html', 'docs/examples/index.html', 'docs/migration/index.html', 'docs/development/index.html', 'docs/releasing/index.html', 'search.json', 'robots.txt', 'sitemap.xml', '.nojekyll']) {
  if (!existsSync(join('out', path))) throw new Error(`Static export is missing ${path}`);
}
for (const file of readdirSync('out', { recursive: true }).filter(path => path.endsWith('.html'))) {
  const html = readFileSync(join('out', file), 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/[^"<>]+)"/g)) {
    const url = match[1].split(/[?#]/)[0];
    if (url.startsWith('//')) continue;
    if (basePath && url !== basePath && !url.startsWith(`${basePath}/`)) throw new Error(`Unprefixed static URL in ${file}: ${url}`);
    const path = decodeURIComponent(url.slice(basePath.length));
    if (!existsSync(join('out', path)) && !existsSync(join('out', path, 'index.html'))) throw new Error(`Broken static URL in ${file}: ${url}`);
  }
}
writeFileSync('out/_build.json', JSON.stringify({ basePath }));
console.log(`Verified static routes, assets, and base-path links (${basePath || '/'}).`);
