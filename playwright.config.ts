import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run build && npm run preview -- --port 4173', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120_000 },
  use: { baseURL: 'http://localhost:4173', locale: 'pt-BR' },
  projects: [{ name: 'mobile', use: { viewport: { width: 390, height: 800 } } }, { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } }],
})
