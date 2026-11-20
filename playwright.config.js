import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173/', trace: 'off' },
  webServer: { command: 'node tools/serve.mjs', port: 4173, reuseExistingServer: true },
  projects: [
    { name: 'pc', use: { viewport: { width: 1366, height: 860 } } },
    { name: 'telefono', use: { ...devices['iPhone 13'], browserName: 'chromium' } }
  ]
});
