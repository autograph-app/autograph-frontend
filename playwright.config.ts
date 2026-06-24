import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 60000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*scenarios\.spec\.ts/,
    },
    {
      name: 'responsive',
      testMatch: /.*responsive\.spec\.ts/,
      use: {
        // Run responsive tests on different viewports
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'functional',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*functional\.spec\.ts/,
    },
  ],

  // Run Next.js local server before starting the tests if not already running
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
