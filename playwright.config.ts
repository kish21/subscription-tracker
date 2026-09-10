import { defineConfig, devices } from '@playwright/test'

try {
  process.loadEnvFile?.('.env')
} catch {
  // Ignore if .env is missing (CI injects env vars directly) or already loaded
}

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

/**
 * E2E configuration for the M1 core journey.
 *
 * `E2E_BASE_URL` lets the same suite run against a deployed environment
 * (M3-SLICE-01) without editing the tests — nothing here is hardcoded to local.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.test.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only manage a server when pointing at localhost; a deployed URL is left alone.
  webServer: BASE_URL.includes('localhost')
    ? {
        command: 'npx next dev',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
})
