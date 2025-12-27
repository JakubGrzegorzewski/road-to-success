import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import {pagesLinks} from "@/scripts/pagesLinks.ts";

export default defineConfig({
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
    server: {
        proxy: {
            '/api': {
                target: 'https://pdf-generator-962523277913.europe-west1.run.app',
                changeOrigin: true,
                secure: true,
                ws: false,
            },
        }
    }
})
