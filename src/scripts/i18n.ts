import { createI18n } from 'vue-i18n'
import pl from '@/locales/pl.json'
import en from '@/locales/en.json'

export const SUPPORTED_LOCALES = ['pl', 'en'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
const STORAGE_KEY = 'locale'

function initialLocale(): AppLocale {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) return saved as AppLocale
    } catch {
        /* storage unavailable */
    }
    return 'pl'
}

const i18n = createI18n({
    legacy: false,
    locale: initialLocale(),
    fallbackLocale: 'pl',
    messages: {
        pl,
        en,
    },
})

export function setLocale(locale: AppLocale): void {
    i18n.global.locale.value = locale
    try {
        localStorage.setItem(STORAGE_KEY, locale)
    } catch {
        /* storage unavailable */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = locale
}

export default i18n
