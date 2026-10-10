import { createServer } from 'node:http';
import { build } from 'esbuild';

const result = await build({ entryPoints: ['test/browser/fixture.tsx'], bundle: true, write: false, format: 'esm', platform: 'browser', define: { 'process.env.NODE_ENV': '"development"' } });
const html = '<!doctype html><html lang="en"><head><title>Haptic interaction fixture</title></head><body><main id="root"></main><script type="module" src="/fixture.js"></script></body></html>';
createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/fixture.js' ? 'text/javascript' : 'text/html');
  response.end(request.url === '/fixture.js' ? result.outputFiles[0].contents : html);
}).listen(4176, '127.0.0.1');
