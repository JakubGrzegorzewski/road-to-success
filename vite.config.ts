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
        proxy : {
            '/generate-pdf': {
                target: 'https://api.grzegorzewski.app/generate-pdf/',
                changeOrigin : true,
                secure: true
            }
        }
    },
    pwa: {
        iconPaths: {
            favicon32: '/src/assets/favicon.ico',
        }
    }
}