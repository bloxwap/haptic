import { defineConfig, devices } from '@playwright/test';

const remote = process.env.DOCS_URL;
const port = Number(process.env.DOCS_PORT ?? 4177);
export default defineConfig({
  testDir: 'test',
  use: { baseURL: remote ?? `http://127.0.0.1:${port}/haptic/`, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: remote ? undefined : { command: 'node scripts/preview.mjs', port, env: { PORT: String(port) }, reuseExistingServer: !process.env.CI },
});
