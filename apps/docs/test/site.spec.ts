import { expect, test } from '@playwright/test';

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
