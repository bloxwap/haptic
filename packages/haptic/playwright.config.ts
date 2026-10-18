import { defineConfig, devices } from '@playwright/test';

// Playwright creates Firefox profiles via os.tmpdir() in this Node process.
// Several runners share each mini, so CI points TMPDIR at a unique /tmp dir.
if (process.env.HAPTIC_FIREFOX_TMPDIR) process.env.TMPDIR = process.env.HAPTIC_FIREFOX_TMPDIR;

const firefoxLaunch = {
  ...(process.env.HAPTIC_FIREFOX_EXECUTABLE ? { executablePath: process.env.HAPTIC_FIREFOX_EXECUTABLE } : {}),
  ...(process.env.HAPTIC_FIREFOX_TMPDIR ? { env: { ...process.env, TMPDIR: process.env.HAPTIC_FIREFOX_TMPDIR } } : {}),
};

export default defineConfig({
  testDir: 'test/browser',
  use: { baseURL: 'http://127.0.0.1:4176', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], launchOptions: firefoxLaunch } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: { command: 'node test/browser/server.mjs', port: 4176, reuseExistingServer: !process.env.CI },
});
