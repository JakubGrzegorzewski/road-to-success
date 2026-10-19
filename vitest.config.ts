import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/** Unit, merge and Worker logic tests (Node + fake-indexeddb). */
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify('test'),
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            // Workers runtime module, replaced by a stub outside workerd
            'cloudflare:workers': fileURLToPath(new URL('./tests/worker/stubs/cloudflare-workers.ts', import.meta.url)),
        },
    },
    test: {
        environment: 'node',
        include: ['tests/unit/**/*.test.ts', 'tests/worker/**/*.test.ts'],
        exclude: ['tests/worker/**/*.integration.test.ts'],
        setupFiles: ['fake-indexeddb/auto'],
    },
})
