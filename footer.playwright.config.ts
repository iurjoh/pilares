import { defineConfig } from '@playwright/test'

// Focused regression matrix. CI also discovers this spec through the default config.
export default defineConfig({
  testDir: 'e2e',
  testMatch: 'footer-spacing.spec.ts',
  workers: 2,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
})
