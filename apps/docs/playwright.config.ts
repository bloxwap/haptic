import { defineConfig, devices } from '@playwright/test';

const remote = process.env.DOCS_URL;
const port = Number(process.env.DOCS_PORT ?? 4177);
const firefoxLaunch = {
  ...(process.env.HAPTIC_FIREFOX_EXECUTABLE ? { executablePath: process.env.HAPTIC_FIREFOX_EXECUTABLE } : {}),
  // Nightly cannot create profiles under GitHub's $RUNNER_TEMP on macOS.
  ...(process.platform === 'darwin' ? { env: { ...process.env, TMPDIR: '/tmp' } } : {}),
};
export default defineConfig({
  testDir: 'test',
  use: { baseURL: remote ?? `http://127.0.0.1:${port}/haptic/`, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], launchOptions: firefoxLaunch } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: remote ? undefined : { command: 'node scripts/preview.mjs', port, env: { PORT: String(port) }, reuseExistingServer: !process.env.CI },
});
