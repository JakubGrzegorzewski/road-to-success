import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { appState } from '@/scripts/appState'
import { __setDoc, ensureMeta, getDoc } from './doc'
import { startEventBridge } from './events'
import { migrateFromDexie } from './migrateFromDexie'
import { startTabSync, type TabSyncHandle } from './tabSync'

/** IndexedDB database holding the Yjs document (y-indexeddb). */
export const DOC_DB_NAME = 'road-to-success'

let persistence: IndexeddbPersistence | null = null
let tabSync: TabSyncHandle | null = null
let stopEvents: (() => void) | null = null
let ready: Promise<void> | null = null

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`timeout after ${ms} ms`)), ms)
        promise.then(
            (v) => {
                clearTimeout(t)
                resolve(v)
            },
            (e) => {
                clearTimeout(t)
                reject(e)
            },
        )
    })
}

/**
 * Loads the local document: y-indexeddb → one-time Dexie migration → event bridge.
 * Safe to call many times; every facade awaits it before touching data.
 */
export function initStore(): Promise<void> {
    if (ready) return ready
    ready = (async () => {
        const doc = getDoc()
        if (typeof indexedDB !== 'undefined') {
            try {
                persistence = new IndexeddbPersistence(DOC_DB_NAME, doc)
                await withTimeout(persistence.whenSynced, 10_000)
                appState.storageMode = 'indexeddb'
            } catch (e) {
                console.warn('[store] IndexedDB unavailable – data is kept in memory only', e)
            }
        }
        try {
            await migrateFromDexie(doc)
        } catch (e) {
            console.error('[store] migration from the previous version failed', e)
        }
        ensureMeta(doc)
        stopEvents = startEventBridge(doc)
        tabSync = startTabSync(doc, onReplacedInOtherTab)
        appState.storeReady = true
        void requestPersistentStorage()
    })()
    return ready
}

export const storeReady = initStore

function onReplacedInOtherTab() {
    // Stop writing immediately: the other tab is deleting this database.
    void persistence?.destroy()
    persistence = null
    appState.replacedInOtherTab = true
}

/**
 * Asks the browser not to evict our data (Safari/ITP deletes script storage of sites that were
 * not used for a while unless the app is installed or storage is persistent).
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
    try {
        if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null
        const already = await navigator.storage.persisted?.()
        const granted = already || (await navigator.storage.persist())
        appState.storagePersisted = granted
        return granted
    } catch {
        return null
    }
}

/**
 * Deletes this device's copy of the document (used by "start from the room's data").
 * Other tabs are told to stop first. The caller is expected to reload the page afterwards.
 */
export async function destroyLocalDocument(): Promise<void> {
    tabSync?.broadcastReset()
    tabSync?.stop()
    stopEvents?.()
    if (persistence) {
        // y-indexeddb's clearData() does not wait for the deletion, so delete the database here
        await persistence.destroy()
        persistence = null
    }
    if (typeof indexedDB === 'undefined') return
    const deleted = new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(DOC_DB_NAME)
        req.onsuccess = req.onerror = () => resolve()
    })
    // a tab that does not react (frozen in the background) could block the deletion forever
    await withTimeout(deleted, 5_000).catch((e) => console.warn('[store] local database not deleted yet', e))
}

/** Tests only: use a fresh in-memory document without persistence, migration or tab sync. */
export function __useInMemoryStore(doc: Y.Doc = new Y.Doc()): Y.Doc {
    stopEvents?.()
    tabSync?.stop()
    void persistence?.destroy()
    persistence = null
    tabSync = null
    __setDoc(doc)
    ensureMeta(doc)
    stopEvents = null
    ready = Promise.resolve()
    appState.storeReady = true
    return doc
}

/** Tests only: forget the initialised store so the next initStore() starts over. */
export function __resetStore(): void {
    stopEvents?.()
    tabSync?.stop()
    void persistence?.destroy()
    persistence = null
    tabSync = null
    stopEvents = null
    ready = null
    appState.storeReady = false
}
