import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { eventBus, ITypesEnum } from '@/scripts/eventBus'

/** Re-runs `handler` when the document changes (locally, from sync or an import); auto-unsubscribes. */
export function useDbUpdates(types: readonly ITypesEnum[] | 'all', handler: (type: ITypesEnum) => void) {
    const listener = ({ type }: { type: ITypesEnum }) => {
        if (types === 'all' || types.includes(type)) handler(type)
    }
    onMounted(() => eventBus.on('db-update', listener))
    onBeforeUnmount(() => eventBus.off('db-update', listener))
}

/** Breakpoints used by the layout: phone < 600 px, table views from 960 px (Vuetify `md`). */
export function useLayout() {
    const display = useDisplay()
    return {
        isMobile: computed(() => display.xs.value),
        isWide: computed(() => display.mdAndUp.value),
    }
}

/** A ref with the current time, refreshed every `intervalMs` (for "2 min ago" labels). */
export function useNow(intervalMs = 30_000) {
    const now = ref(Date.now())
    let timer: ReturnType<typeof setInterval> | undefined
    onMounted(() => {
        timer = setInterval(() => (now.value = Date.now()), intervalMs)
    })
    onBeforeUnmount(() => clearInterval(timer))
    return now
}

export function useRelativeTime() {
    const { locale } = useI18n()
    return (timestamp: number, now = Date.now()) => {
        const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
        const seconds = Math.round((timestamp - now) / 1000)
        const abs = Math.abs(seconds)
        if (abs < 45) return rtf.format(0, 'second')
        if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
        if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), 'hour')
        return rtf.format(Math.round(seconds / 86_400), 'day')
    }
}

export function formatDate(timestamp: number | string | Date, locale: string): string {
    return new Date(timestamp).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}
