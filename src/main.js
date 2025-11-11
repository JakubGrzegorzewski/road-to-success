import { createApp } from 'vue'
import App from './App.vue'
import router from './scripts/router.ts'
import i18n from './scripts/i18n.ts'
import seedDatabase from "@/scripts/seedDatabase.ts";

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

export async function fetchPUT(url, data) {
    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (err) {
        console.error('Error fetching:', err);
        return null;
    }
}

export async function fetchPOST(url, data) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
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
app.config.globalProperties.$put = fetchPUT;
app.config.globalProperties.$post = fetchPOST;
app.mount('#app')