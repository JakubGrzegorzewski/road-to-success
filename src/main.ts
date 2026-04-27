import { createApp } from 'vue'
import App from './App.vue'
import { msalInstance } from './scripts/authConfig.ts'
import router from './scripts/router.js'
import i18n from './scripts/i18n.js'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {createVuetify} from "vuetify/framework";

const vuetify = createVuetify({
    components,
    directives,
})

const initApp = async () => {
    await msalInstance.initialize();

    try {
        await msalInstance.handleRedirectPromise();
    } catch (error) {
        const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
        const ignorable =
            message.includes("no_token_request_cache_error") ||
            message.includes("redirect_bridge_timeout") ||
            message.includes("timed_out");

        if (!ignorable) {
            console.error("MSAL redirect handling failed", error);
        }
    }

    const app = createApp(App);
    app.use(router);
    app.use(i18n);
    app.use(vuetify);
    app.mount('#app');
};

initApp();