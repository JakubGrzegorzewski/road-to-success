import { createApp } from 'vue'
import App from './App.vue'
import router from './scripts/router.js'
import i18n from './scripts/i18n.ts'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {createVuetify} from "vuetify/framework";

const vuetify = createVuetify({
    components,
    directives,
})

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(vuetify)
app.mount('#app')
