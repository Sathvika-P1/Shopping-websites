import { defineConfig } from '@playwright/test';

const port = 3100;

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: 'pnpm build && node dist/server.js',
    url: `http://127.0.0.1:${port}/health`,
    env: { PORT: String(port), HOST: '127.0.0.1' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
