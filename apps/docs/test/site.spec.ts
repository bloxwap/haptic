import { expect, test } from '@playwright/test';

declare global {
  interface Window { imperativeRequests: unknown[] }
}

test('imperative requests report browser acceptance for sync, awaited and timer calls', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    const requests: unknown[] = [];
    Object.defineProperty(window, 'imperativeRequests', { value: requests });
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (pattern: unknown) => { requests.push(pattern); return true; } });
  });
  await page.goto(new URL('docs/examples/', baseURL!).href);
  const demo = page.getByRole('region', { name: 'Imperative feedback examples' });
  let requests = 0;
  for (const name of ['Request now', 'Request after await', 'Request from timer']) {
    await demo.getByRole('button', { name, exact: true }).click();
    requests++;
    await expect.poll(() => page.evaluate(() => window.imperativeRequests.length)).toBe(requests);
    await expect(demo.getByRole('status')).toHaveText('Available: true · Request accepted: true · Route: browser-vibration');
  }
  await page.evaluate(() => { Object.defineProperty(navigator, 'vibrate', { value: () => false }); });
  await demo.getByRole('button', { name: 'Request now', exact: true }).click();
  await expect(demo.getByRole('status')).toContainText('Request accepted: false · Route: none · vibration-rejected');
});

test('imperative iOS requests remain unavailable and add no native controls', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    Object.defineProperties(navigator, {
      vibrate: { configurable: true, value: undefined },
      platform: { configurable: true, value: 'iPhone' },
      userAgent: { configurable: true, value: 'AppleWebKit' },
    });
  });
  await page.goto(new URL('docs/examples/', baseURL!).href);
  const demo = page.getByRole('region', { name: 'Imperative feedback examples' });
  await expect(demo.getByRole('button', { name: 'Request now', exact: true })).toBeEnabled();
  const nativeControls = await page.locator('input[switch]').count();
  for (const name of ['Request now', 'Request after await', 'Request from timer']) {
    await demo.getByRole('button', { name, exact: true }).click();
    if (name === 'Request from timer') await expect(demo.getByRole('status')).toHaveText('Waiting for timer.');
    await expect(demo.getByRole('status')).toContainText('Request accepted: false · Route: none');
  }
  await expect(demo.locator('input, label, [aria-hidden]')).toHaveCount(0);
  await expect(page.locator('input[switch]')).toHaveCount(nativeControls);
});

for (const example of [
  { name: 'preset board', path: '', target: /selection/i, setting: 'Feedback enabled', status: '.status' },
  { name: 'interaction examples', path: 'docs/examples/', target: 'Count action', setting: 'Enable feedback', status: '#interaction-result' },
]) test(`${example.name} controls wait for their handlers while scripts load`, async ({ page, baseURL }) => {
  let releaseScripts!: () => void;
  const scripts = new Promise<void>(resolve => { releaseScripts = resolve; });
  await page.route('**/*.js', async route => { await scripts; await route.continue(); });
  try {
    await page.goto(new URL(example.path, baseURL!).href, { waitUntil: 'commit' });
    const target = page.getByRole('button', { name: example.target });
    await expect(target).toBeVisible();
    await expect(target).toBeDisabled();
    await expect(page.getByLabel(example.setting, { exact: true })).toBeDisabled();
    if (example.path) await expect(page.getByRole('button', { name: 'Submit form' })).toBeDisabled();
    releaseScripts();
    await target.click();
    await expect(page.locator(example.status)).toContainText('Actions: 1');
    if (example.path) {
      await page.getByRole('button', { name: 'Submit form' }).click();
      await expect(page.locator(example.status)).toContainText('Form submissions: 1');
    }
  } finally {
    releaseScripts();
  }
});

test('home demo, docs, static search, deep links, and responsive layout', async ({ page, baseURL }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL!);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('physical response');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: /selection/i }).click();
  await expect(page.locator('.status')).toContainText('Actions: 1');
  await page.getByLabel('Feedback enabled').uncheck();
  await page.getByRole('button', { name: /heavy/i }).click();
  await expect(page.locator('.status')).toContainText('Actions: 2');
  if (page.viewportSize()!.width > 600) {
    await page.getByRole('button', { name: /search/i }).first().click();
    await page.getByRole('combobox').fill('intensity');
    await expect(page.getByRole('dialog')).toContainText('API');
    await page.keyboard.press('Escape');
  }
  await page.getByRole('link', { name: /read the docs/i }).click();
  if (page.viewportSize()!.width <= 600) await page.getByRole('button', { name: 'Open Sidebar', exact: true }).first().click();
  await page.getByRole('link', { name: 'API', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'API', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('triggerOptions');
  if (page.viewportSize()!.width <= 600) await page.getByRole('button', { name: 'Open Sidebar', exact: true }).first().click();
  await page.getByRole('link', { name: 'Interaction examples', exact: true }).first().click();
  await page.getByRole('button', { name: 'Count action' }).click();
  await expect(page.locator('#interaction-result')).toContainText('Actions: 1');
  await page.getByRole('button', { name: 'Submit form' }).click();
  await expect(page.locator('#interaction-result')).toContainText('Form submissions: 1');
  await page.getByLabel('Form value').fill('changed');
  await page.getByRole('button', { name: 'Reset form' }).click();
  await expect(page.getByLabel('Form value')).toHaveValue('original');
  await page.getByRole('button', { name: 'Open drawer example' }).click();
  const drawer = page.getByRole('dialog', { name: 'Haptic inside a Vaul drawer' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Drawer action', exact: true }).click();
  await drawer.getByRole('button', { name: 'Close drawer', exact: true }).click();
  await expect(page.locator('#interaction-result')).toContainText('Actions: 2');
  expect(errors).toEqual([]);
  const index = await page.request.get(new URL('search.json', baseURL!).href);
  expect(index.ok()).toBe(true); expect(await index.text()).toContain('intensity');
});

test('HIG palette and reduced motion retain the haptic action', async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseURL!);
  const target = page.getByRole('button', { name: /selection/i });
  expect(await target.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  // HIG text role from @bloxwap/hig-tokens/css: sRGB fallback, or its oklch value where supported.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--hig-text').trim())).toMatch(/^(#fafafa|oklch\((0\.985|98\.5%) 0 0\))$/);
  await expect(page.getByLabel('Feedback enabled', { exact: true })).toBeChecked();
  await target.click();
  await expect(page.locator('.status')).toContainText('Actions: 1');
  await page.goto(new URL('docs/hig/', baseURL!).href);
  await expect(page.getByRole('heading', { level: 1, name: 'HIG integration' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Physical iPhone/Android');
});

test('HIG install tabs: keyboard navigation, copy action and status', async ({ page, baseURL, browserName, context }) => {
  await page.goto(baseURL!);
  const tabs = page.getByRole('tablist', { name: 'Package manager' });
  const npm = tabs.getByRole('tab', { name: 'npm', exact: true });
  await expect(npm).toBeEnabled();
  await expect(npm).toHaveAttribute('aria-selected', 'true');
  await npm.focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: 'pnpm' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('pnpm add @bloxwap/haptic');
  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: 'yarn' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tabs.getByRole('tab', { name: 'bun' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.getByRole('tab', { name: 'yarn' })).toBeFocused();
  const panel = page.getByRole('tabpanel');
  await expect(panel).toContainText('yarn add @bloxwap/haptic');
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await panel.getByRole('button', { name: 'Copy install command' }).click();
  const status = page.locator('.package-install [role="status"]');
  if (browserName === 'chromium') {
    await expect(status).toHaveText('Command copied to clipboard.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('yarn add @bloxwap/haptic');
  } else {
    // Clipboard permission differs per engine; either outcome must be announced and leave the command selectable.
    await expect(status).toHaveText(/Command copied to clipboard\.|Could not copy\. Select the command to copy it manually\./);
  }
});

test('keyboard search and navigation reach a deep-linked docs page', async ({ page, baseURL, isMobile }) => {
  await page.goto(new URL('docs/', baseURL!).href);
  if (isMobile) await page.getByRole('button', { name: /search/i }).first().click();
  else await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.getByRole('combobox').fill('Vaul drawer');
  await expect(dialog).toContainText('Interaction examples');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/haptic\/docs\/examples\/(#.*)?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Interaction examples' })).toBeVisible();
  const count = page.getByRole('button', { name: 'Count action' });
  await expect(count).toBeEnabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // The closing search dialog restores focus to its trigger; focus the target once that settles.
  await expect(async () => { await count.focus(); await expect(count).toBeFocused({ timeout: 250 }); }).toPass();
  await page.keyboard.press('Enter');
  await expect(page.locator('#interaction-result')).toContainText('Actions: 1');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Focus original button' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Count action' })).toBeFocused();
});

test('docs callouts and code controls use HIG presentation', async ({ page, baseURL, isMobile }) => {
  await page.goto(new URL('docs/platforms/', baseURL!).href);
  const callout = page.locator('.docs-callout [data-severity="warning"]');
  await expect(callout).toContainText('Not hardware-certified');
  await expect(callout).toContainText('cannot establish tactile output');
  expect(await callout.evaluate(el => getComputedStyle(el).borderInlineStartWidth)).toBe('3px');
  await page.goto(baseURL!);
  const action = page.getByRole('link', { name: /try the haptic board/i });
  // HIG buttons are 44px by default (hig#80); touch keeps the comfortable 48px target role.
  expect(await action.evaluate((el, min) => el.classList.contains('hig-button') && parseFloat(getComputedStyle(el).minHeight) >= min, isMobile ? 48 : 44)).toBe(true);
  // HIG control CSS reads --hig-font-sans (hig#65): with no host font bridge the button renders in a loaded Bloxwap face.
  const face = await action.evaluate(async el => {
    await document.fonts.ready;
    const family = getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/["']/g, '');
    return { family, loaded: [...document.fonts].some(font => font.family.replace(/["']/g, '') === family && font.status === 'loaded') };
  });
  expect(face.family).toMatch(/bloxwap/i);
  expect(face.loaded).toBe(true);
  await expect(page.locator('.code-window pre')).toHaveAttribute('tabindex', '0');
});
