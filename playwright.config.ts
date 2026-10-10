import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the real app: Vite (proxying /api) in front of
// `wera serve` and PostgreSQL. Start the API yourself (see e2e/README.md);
// Playwright starts Vite. PW_CHROME_PATH runs an installed Chrome instead
// of Playwright's bundled browser.
declare const process: { env: Record<string, string | undefined> };
const chrome = process.env.PW_CHROME_PATH;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...(chrome ? { launchOptions: { executablePath: chrome } } : {}) },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], ...(chrome ? { launchOptions: { executablePath: chrome } } : {}) },
      testMatch: /smoke\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npx vite --port 5173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    env: { WERA_API: process.env.WERA_API ?? 'http://127.0.0.1:8080' },
  },
});
