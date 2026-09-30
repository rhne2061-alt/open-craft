import { defineConfig } from '@playwright/test';
const base = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  use: { baseURL: `http://127.0.0.1:4322${base}`, channel: process.env.PLAYWRIGHT_CHANNEL || undefined, trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --port 4322 --ignore-lock', url: `http://127.0.0.1:4322${base}`, reuseExistingServer: !process.env.CI },
});
