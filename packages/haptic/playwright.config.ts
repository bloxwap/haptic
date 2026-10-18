import { defineConfig, devices } from '@playwright/test';

const firefoxLaunch = {
  ...(process.env.HAPTIC_FIREFOX_EXECUTABLE ? { executablePath: process.env.HAPTIC_FIREFOX_EXECUTABLE } : {}),
  // Nightly cannot create profiles under $RUNNER_TEMP; CI allocates a unique /tmp dir.
  ...(process.platform === 'darwin' && process.env.HAPTIC_FIREFOX_TMPDIR
    ? { env: { ...process.env, TMPDIR: process.env.HAPTIC_FIREFOX_TMPDIR } }
    : {}),
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
