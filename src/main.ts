import { createApp } from 'vue'
import App from './App.vue'
import router from './scripts/router.js'
import i18n from './scripts/i18n.js'
import 'vuetify/styles'
import { vuetify } from './scripts/vuetify.ts'
import './scripts/bootstrap'
import mitt from "@/scripts/mitt.ts";

const app = createApp(App)


export enum CardType {
    DEFAULT = 'default',
    ADD = 'add',
    IMPORT = 'import'
}

export enum ITypesEnum {
    ERank,
    ERankInProgress,
    ERequirement,
    ETask,
    ETaskComment,
    EUser
}

// 1. Define the events and their expected payloads
type ApplicationEvents = {
    'db-update': { type: ITypesEnum};
};

// 2. Create and export the typed emitter instance
export const eventBus = mitt<ApplicationEvents>();

app.use(router)
app.use(i18n)
app.use(vuetify)
app.mount('#app')
