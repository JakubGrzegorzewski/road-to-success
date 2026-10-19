import { reactive } from 'vue'

/** App-wide UI flags that are not user data. */
export const appState = reactive({
    /** The local document finished loading (IndexedDB + migration). */
    storeReady: false,
    /** 'memory' means nothing is saved on this device (IndexedDB unavailable). */
    storageMode: 'memory' as 'indexeddb' | 'memory',
    /** navigator.storage.persist() result; null = unknown/unsupported. */
    storagePersisted: null as boolean | null,
    /** Another tab replaced this device's data with a sync room's data; this tab must reload. */
    replacedInOtherTab: false,
    /** A new version of the app was installed by the service worker. */
    updateReady: false,
})
