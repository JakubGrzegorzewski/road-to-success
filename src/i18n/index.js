import { createI18n } from 'vue-i18n'
import pl from '@/locales/pl.json'
import en from '@/locales/en.json'


const i18n = createI18n({
    legacy: false,
    locale: 'pl',
    fallbackLocale: 'en',
    messages: {
        pl,
        en
    }
})

// Function to load locale messages
export async function loadLocaleMessages(locale) {
    const messages = await import(`@/locales/${locale}.json`)
    i18n.global.setLocaleMessage(locale, messages.default)
    return messages
}

export default i18n