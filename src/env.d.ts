/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

/** App version (package.json version + short commit in CI), injected by Vite. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    /** Override of the signaling endpoint (default: wss://<same host>/signal). */
    readonly VITE_SIGNALING_URL?: string;
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<object, object, unknown>
    export default component
}

// CSS-only entry imported for its side effect in main.ts. TypeScript 6 checks that side-effect
// imports resolve (noUncheckedSideEffectImports), and this package export has no typings.
declare module 'vuetify/styles' {}
