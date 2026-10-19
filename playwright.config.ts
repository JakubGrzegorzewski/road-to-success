import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests against the production build served by the real Worker (`wrangler dev`: static assets
 * + signaling Durable Object). Set PW_BASE_URL to test an already running server instead.
 */
const external = process.env.PW_BASE_URL

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 90_000,
    expect: { timeout: 15_000 },
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: {
        baseURL: external ?? 'http://localhost:8787',
        trace: 'retain-on-failure',
        locale: 'pl-PL',
    },
    webServer: external
        ? undefined
        : {
              command: 'npm run build && npx wrangler dev --port 8787',
              url: 'http://localhost:8787',
              reuseExistingServer: !process.env.CI,
              timeout: 240_000,
          },
    projects: [
        {
            name: 'phone',
            testMatch: /phone\.spec\.ts/,
            use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } },
        },
        {
            name: 'desktop',
            testMatch: /(desktop|sync|comments|help)\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } },
        },
        // screenshots for the help articles, only with `npm run help:screens` (writes src/help/img)
        ...(process.env.HELP_SCREENS
            ? [{ name: 'help-screens', testMatch: /help-screens\.spec\.ts/, use: { ...devices['Desktop Chrome'] } }]
            : []),
    ],
})
