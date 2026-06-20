import { fileURLToPath, URL } from 'url'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { version } from './package.json'

export default {
    base: '/',
    plugins: [
        vue(),
        vueDevTools(),
    ],
    define: {
        __APP_VERSION__: JSON.stringify(version)
    },
    resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    pwa: {
        iconPaths: {
            favicon32: '/src/assets/favicon.ico',
        }
    }
}