import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)

export async function fetchGET(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return await response.json();
    } catch (err) {
        console.error('Error fetching:', err);
        return null;
    }
}

export async function fetchDELETE(url) {
    try {
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return await response.json();
    } catch (err) {
        console.error('Error fetching:', err);
        return null;
    }
}

app.use(router)
app.use(i18n)
app.config.globalProperties.$fetch = fetchGET;
app.config.globalProperties.$delete = fetchDELETE;
app.mount('#app')