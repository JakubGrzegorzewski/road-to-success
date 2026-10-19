import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import { version } from './package.json'

// "2.0.0" locally, "2.0.0+abc1234" in CI (shown in the footer and stored in exported files)
const commit = process.env.GITHUB_SHA?.slice(0, 7)
const appVersion = commit ? `${version}+${commit}` : version

export default defineConfig(({ mode }) => ({
    base: '/',
    plugins: [
        vue(),
        mode === 'development' && vueDevTools(),
        VitePWA({
            strategies: 'generateSW',
            registerType: 'autoUpdate',
            // registered in main.ts through `virtual:pwa-register`
            injectRegister: false,
            includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png', 'icons/icon.svg'],
            manifest: {
                id: '/',
                name: 'Droga do sukcesu',
                short_name: 'Droga do sukcesu',
                description: 'Planowanie i prowadzenie prób na stopnie harcerskie i instruktorskie.',
                lang: 'pl',
                dir: 'ltr',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'any',
                background_color: '#F3F6F4',
                theme_color: '#262F33',
                categories: ['education', 'productivity'],
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                // everything needed offline, including pdfmake (PDF works without network)…
                globPatterns: ['**/*.{js,css,html,svg,png,ico,ttf,woff2,webmanifest}'],
                // …except the A4 page backgrounds (≈ 300 KB each): cached on first use instead
                globIgnores: ['**/*-background-*.png'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/signal/, /^\/api\//],
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/assets/') && url.pathname.includes('-background-'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'rank-backgrounds',
                            expiration: { maxEntries: 10 },
                        },
                    },
                ],
            },
            devOptions: { enabled: false },
        }),
    ],
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        target: ['es2020', 'safari15'],
        // pdfmake (with its embedded Roboto font) is one lazily loaded ~2 MB chunk
        chunkSizeWarningLimit: 2600,
    },
    server: {
        host: true,
    },
}))
