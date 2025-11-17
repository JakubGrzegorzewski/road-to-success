import { createApp } from 'vue'
import App from './App.vue'
import router from './scripts/router.js'
import i18n from './scripts/i18n.ts'

const app = createApp(App)

app.use(router)
app.use(i18n)
app.mount('#app')