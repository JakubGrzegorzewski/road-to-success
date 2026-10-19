import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './scripts/router'
import i18n from './scripts/i18n'
import 'vuetify/styles'
import { vuetify } from './scripts/vuetify'
import { initStore } from './scripts/store/persistence'
import { initSync } from './scripts/sync/syncService'

console.info('Droga do sukcesu', __APP_VERSION__)
document.documentElement.lang = i18n.global.locale.value

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(vuetify)
app.mount('#app')

// Load the local document (IndexedDB + one-time migration), then resume syncing.
// Views do not wait for this: every data facade awaits the store itself.
initStore()
    .then(() => initSync())
    .catch((e) => console.error('[startup]', e))

if (import.meta.env.PROD) {
    // Service worker (vite-plugin-pwa, autoUpdate): the app works offline and updates itself.
    registerSW({ immediate: true })
}
