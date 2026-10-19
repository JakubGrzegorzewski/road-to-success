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

/**
 * Polish plural forms for messages with three variants ("1 uwaga | 2 uwagi | 5 uwag"):
 * 1 → first, 2–4 (but not 12–14) → second, everything else → third.
 * Two-variant messages keep vue-i18n's default (1 → first, otherwise second).
 */
export function polishPlural(choice: number, choicesLength: number): number {
    const n = Math.abs(choice)
    if (choicesLength === 3) {
        if (n === 1) return 0
        const mod10 = n % 10
        const mod100 = n % 100
        return mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? 1 : 2
    }
    if (choicesLength === 2) return n === 1 ? 0 : 1
    return Math.min(n, choicesLength - 1)
}

const i18n = createI18n({
    legacy: false,
    locale: initialLocale(),
    fallbackLocale: 'pl',
    pluralRules: { pl: polishPlural },
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
