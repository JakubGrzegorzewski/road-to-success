import { fileURLToPath, URL } from 'url'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { pagesLinks } from './src/scripts/pagesLinks.js'
import { version } from './package.json'

export default {
    base: pagesLinks.roadToSuccess,
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
    server : {
        proxy: {
            '/generate-pdf': {
                target: 'https://api.grzegorzewski.app',
                changeOrigin: true, // Crucial for SSL/SNI
                secure: false,      // Add this if the certificate is self-signed or invalid
            }
        }
    },
    pwa: {
        iconPaths: {
            favicon32: 'https://grzegorzewski.app/favicon.svg',
        }
    }
}