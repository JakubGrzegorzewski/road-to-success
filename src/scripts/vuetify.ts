import { createVuetify } from 'vuetify'
import { VApp } from 'vuetify/components/VApp'
import { VMain } from 'vuetify/components/VMain'
import { VBottomNavigation } from 'vuetify/components/VBottomNavigation'
import { VBtn } from 'vuetify/components/VBtn'

const brand = {
    primary: '#262F33',
    primaryLight: '#405058',
    secondary: '#329ED5',
    background: '#F3F6F4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
}

// Only the components the app actually uses are registered (keeps the bundle small).
export const vuetify = createVuetify({
    components: { VApp, VMain, VBottomNavigation, VBtn },
    theme: {
        defaultTheme: 'system',
        themes: {
            light: {
                dark: false,
                colors: {
                    background: brand.background,
                    surface: '#FFFFFF',
                    primary: brand.primary,
                    secondary: brand.secondary,
                    success: brand.success,
                    warning: brand.warning,
                    error: brand.error,
                    info: brand.secondary,
                },
            },
            dark: {
                dark: true,
                colors: {
                    background: brand.primary,
                    surface: brand.primaryLight,
                    primary: brand.background,
                    secondary: brand.secondary,
                    success: brand.success,
                    warning: brand.warning,
                    error: brand.error,
                    info: brand.secondary,
                },
            },
        },
    },
    display: {
        mobileBreakpoint: 'sm',
        thresholds: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920, xxl: 2560 },
    },
})
