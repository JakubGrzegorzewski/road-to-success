import { createApp } from 'vue'
import App from './App.vue'
import router from './scripts/router.js'
import i18n from './scripts/i18n.js'
import 'vuetify/styles'
import { vuetify } from './scripts/vuetify.ts'
import './scripts/bootstrap'

const app = createApp(App)

export const pagesLinks: {
    roadToSuccess: string;
    advancement: string;
    advancementReport: string;
    addPerson: string;
    addAdvancement: string;
} = {
    roadToSuccess: '/',
    advancement: '/stopien/',
    advancementReport: '/stopien/report/',
    addPerson: '/dodaj-osobe/',
    addAdvancement: '/stopnie/',
};


app.use(router)
app.use(i18n)
app.use(vuetify)
app.mount('#app')
