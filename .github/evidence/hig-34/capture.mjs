// usage: node .github/evidence/hig-34/capture.mjs <baseURL> <outDir> <prefix>  (serve apps/docs/out with PORT=4142 node scripts/preview.mjs)
import { createRequire } from 'node:module';
const require = createRequire(process.env.PW_FROM ?? new URL('../../../apps/docs/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, dir, prefix] = process.argv.slice(2);
const pages = [['home', ''], ['demo', '#board'], ['api', 'docs/api/'], ['examples', 'docs/examples/']];
const browser = await chromium.launch();
for (const [vp, size] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport: size, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const [name, path] of pages) {
    await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
    if (name === 'demo') await page.locator('#board').scrollIntoViewIfNeeded();
    if (name === 'examples') await page.locator('.guide-demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/${prefix}-${name}-${vp}.png`, type: 'png' });
  }
  await context.close();
}
await browser.close();
console.log('captured', prefix);
