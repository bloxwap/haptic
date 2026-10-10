import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = resolve('out');
const { basePath } = JSON.parse(readFileSync(resolve(root, '_build.json'), 'utf8'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer((request, response) => {
  let url;
  try { url = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { response.writeHead(400).end(); return; }
  if (basePath && url !== basePath && !url.startsWith(`${basePath}/`)) { response.writeHead(404).end(); return; }
  let path = resolve(root, `.${url.slice(basePath.length) || '/'}`);
  if (path !== root && !path.startsWith(`${root}/`)) { response.writeHead(404).end(); return; }
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html');
  if (!existsSync(path) || !statSync(path).isFile()) { response.writeHead(404).end('Not found'); return; }
  response.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
  response.end(readFileSync(path));
}).listen(Number(process.env.PORT ?? 3904), '0.0.0.0', () => console.log(`Static docs: http://localhost:${process.env.PORT ?? 3904}${basePath}/`));
