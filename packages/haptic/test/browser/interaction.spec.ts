import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function tap(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('vibration requests, keyboard, default actions, and original focus', async ({ page }) => {
  await page.addInitScript(() => {
    const calls: unknown[] = [];
    (window as unknown as { feedback: unknown[] }).feedback = calls;
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (input: unknown) => { calls.push(input); return true; } });
  });
  await page.goto('/');
  const target = page.getByRole('button', { name: 'Tap action' });
  await target.click();
  await expect(page.locator('#actions')).toHaveText('1'); await expect(page.locator('#parent')).toHaveText('1');
  expect(await page.evaluate(() => (window as unknown as { feedback: unknown[] }).feedback[0])).toEqual([2, 6]);
  await page.getByRole('button', { name: 'Focus target' }).click(); await expect(target).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#actions')).toHaveText('2');
  await page.getByRole('button', { name: 'Submit action', exact: true }).click(); await expect(page.locator('#submits')).toHaveText('1');
  await page.getByRole('button', { name: 'Prevent submit' }).click(); await expect(page.locator('#submits')).toHaveText('1');
  await page.getByLabel('Form value').fill('changed');
  await page.getByRole('button', { name: 'Reset action' }).click();
  await expect(page.getByLabel('Form value')).toHaveValue('original');
  await page.getByRole('link', { name: 'Navigate target' }).click(); await expect(page).toHaveURL(/#destination$/);
  await expect(page.getByRole('button', { name: 'Disabled action' })).toBeDisabled();
  expect(await page.evaluate(() => [...new FormData(document.querySelector('form')!).keys()])).toEqual(['token']);
  await page.getByLabel('Enable', { exact: true }).uncheck();
  const before = await page.evaluate(() => (window as unknown as { feedback: unknown[] }).feedback.length);
  await target.click(); await expect(page.locator('#actions')).toHaveText('3');
  expect(await page.evaluate(() => (window as unknown as { feedback: unknown[] }).feedback.length)).toBe(before);
});

test('native routing preserves one action, focus, forms, links, drawers, and accessibility', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperties(navigator, {
      platform: { configurable: true, value: 'iPhone' },
      userAgent: { configurable: true, value: 'iPhone AppleWebKit/605.1.15' },
      maxTouchPoints: { configurable: true, value: 5 },
      vibrate: { configurable: true, value: undefined },
    });
  });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('input[switch]')).toHaveCount(7);
  await expect(page.locator('input[switch]').first()).toHaveCSS('appearance', 'auto');
  const target = page.getByRole('button', { name: 'Tap action' });
  await tap(page, target);
  await expect(page.locator('#actions')).toHaveText('1'); await expect(page.locator('#parent')).toHaveText('1'); await expect(target).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#actions')).toHaveText('2');
  await tap(page, page.getByRole('button', { name: 'Submit action', exact: true })); await expect(page.locator('#submits')).toHaveText('1');
  await tap(page, page.getByRole('button', { name: 'Prevent submit' })); await expect(page.locator('#submits')).toHaveText('1');
  await page.getByLabel('Form value').fill('changed');
  await tap(page, page.getByRole('button', { name: 'Reset action' }));
  await expect(page.getByLabel('Form value')).toHaveValue('original');
  await tap(page, page.getByRole('link', { name: 'Navigate target' })); await expect(page).toHaveURL(/#destination$/);
  await tap(page, page.getByRole('button', { name: 'Drawer action' })); await expect(page.locator('#drawer')).toHaveText('0');
  expect(await page.evaluate(() => [...new FormData(document.querySelector('form')!).keys()])).toEqual(['token']);
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  const violations = (await new AxeBuilder({ page }).analyze()).violations;
  expect(violations).toEqual([]); expect(errors).toEqual([]);
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + 4); await page.mouse.down();
  await page.mouse.move(box.x + box.width - 4, box.y + 4); await page.mouse.up();
  await expect(page.locator('#actions')).toHaveText('3'); // Drawer supplied the third action; drag supplies none.
  await page.getByLabel('Enable', { exact: true }).uncheck();
  await expect(page.locator('input[switch]')).toHaveCount(6);
  await target.click(); await expect(page.locator('#actions')).toHaveText('4');
  await page.getByRole('button', { name: 'Open real drawer' }).click();
  const dialog = page.getByRole('dialog', { name: 'Real Vaul drawer' });
  await expect(dialog).toBeVisible();
  await tap(page, dialog.getByRole('button', { name: 'Real drawer action' }));
  await expect(page.locator('#actions')).toHaveText('5');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close real drawer' }).click();
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('real debug audio, visible engine switch, interrupted patterns, and teardown', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as { contexts: AudioContext[]; vibration: unknown[] };
    state.contexts = []; state.vibration = [];
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) { super(options); state.contexts.push(this); }
    };
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (input: unknown) => { state.vibration.push(input); return true; } });
  });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Debug audio', { exact: true }).check();
  await page.getByRole('button', { name: 'Debug feedback', exact: true }).click();
  await expect(page.getByText('Haptic feedback', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { contexts: AudioContext[] }).contexts[0]?.state)).toBe('running');
  await page.getByRole('button', { name: 'Toggle feedback target' }).click();
  await expect(page.getByText('Haptic feedback', { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { contexts: AudioContext[] }).contexts[0]?.state)).toBe('closed');
  expect(await page.evaluate(() => { const vibration = (window as unknown as { vibration: unknown[] }).vibration; return vibration[vibration.length - 1]; })).toBe(0);
  await page.getByRole('button', { name: 'Toggle feedback target' }).click();
  await page.getByRole('button', { name: 'Debug feedback', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { contexts: AudioContext[] }).contexts.length)).toBe(2);
  await page.getByLabel('Debug audio', { exact: true }).uncheck();
  await expect.poll(() => page.evaluate(() => (window as unknown as { contexts: AudioContext[] }).contexts[1]?.state)).toBe('closed');
  await expect(page.getByText('Haptic feedback', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});
