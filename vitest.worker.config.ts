import { defineConfig } from 'vitest/config'

/**
 * Integration test of the real Worker + Durable Object in workerd (wrangler's local runtime).
 * Run after `npm run build` (the Worker serves ./dist as static assets).
 */
export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/worker/**/*.integration.test.ts'],
        testTimeout: 60_000,
        hookTimeout: 120_000,
    },
})
