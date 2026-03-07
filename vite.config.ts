import { fileURLToPath, URL } from 'url'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { pagesLinks } from './src/scripts/pagesLinks.js'

module.exports = {
    base: pagesLinks.roadToSuccess,
    plugins: [
        vue(),
        vueDevTools(),
    ],
  // base: '/road-to-success/',


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
                rewrite: (path: string) => path.replace(/^\/generate-pdf/, '/generate-pdf')
            }
        }
    },
    pwa: {
        iconPaths: {
            favicon32: '/src/assets/favicon.ico',
        }
    }
}