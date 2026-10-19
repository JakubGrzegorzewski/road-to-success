/**
 * Small per-device key/value store (IndexedDB database `road-to-success-device`).
 *
 * Holds state that must NOT be synchronised with other devices: the sync room and its key,
 * the device name, the Dexie migration marker, backup-reminder timestamps, etc.
 * Falls back to memory when IndexedDB is unavailable (private mode in some browsers).
 */
export interface LocalStateSchema {
    /** Dexie → Yjs migration progress on this device. */
    dexieMigration: { id: string; status: 'started' | 'done' | 'nothing-to-migrate'; at: number };
    /** Sync room this device belongs to. */
    room: { room: string; key: string; joinedAt: number };
    /** Name shown to other devices (Yjs awareness). */
    deviceName: string;
    lastExportAt: number;
    backupReminderSnoozedUntil: number;
    lastSyncedAt: number;
    /** Copy of the local document taken before "start from the room's data" replaced it. */
    backupBeforeRoomJoin: { at: number; update: Uint8Array };
}

export type LocalKey = keyof LocalStateSchema

const DB_NAME = 'road-to-success-device'
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase | null> | null = null
let openedDb: IDBDatabase | null = null
const memory = new Map<string, unknown>()

function openDb(): Promise<IDBDatabase | null> {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
            resolve(null)
            return
        }
        try {
            const req = indexedDB.open(DB_NAME, 1)
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
            }
            req.onsuccess = () => {
                const db = req.result
                // let other tabs (or tests) delete/upgrade the database instead of blocking them
                db.onversionchange = () => {
                    db.close()
                    if (openedDb === db) {
                        openedDb = null
                        dbPromise = null
                    }
                }
                openedDb = db
                resolve(db)
            }
            req.onerror = () => resolve(null)
            req.onblocked = () => resolve(null)
        } catch {
            resolve(null)
        }
    })
    return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
    return openDb().then(
        (db) =>
            new Promise<T | undefined>((resolve, reject) => {
                if (!db) {
                    resolve(undefined)
                    return
                }
                try {
                    const tx = db.transaction(STORE, mode)
                    const req = fn(tx.objectStore(STORE))
                    tx.oncomplete = () => resolve(req.result)
                    tx.onerror = () => reject(tx.error)
                    tx.onabort = () => reject(tx.error)
                } catch (e) {
                    reject(e)
                }
            }),
    )
}

export async function getLocal<K extends LocalKey>(key: K): Promise<LocalStateSchema[K] | undefined> {
    if (memory.has(key)) return memory.get(key) as LocalStateSchema[K]
    try {
        const value = await run<unknown>('readonly', (s) => s.get(key))
        if (value !== undefined) memory.set(key, value)
        return value as LocalStateSchema[K] | undefined
    } catch {
        return undefined
    }
}

export async function setLocal<K extends LocalKey>(key: K, value: LocalStateSchema[K]): Promise<void> {
    memory.set(key, value)
    try {
        await run('readwrite', (s) => s.put(value, key))
    } catch (e) {
        console.warn('[localState] could not persist', key, e)
    }
}

export async function deleteLocal(key: LocalKey): Promise<void> {
    memory.delete(key)
    try {
        await run('readwrite', (s) => s.delete(key))
    } catch {
        /* ignore */
    }
}

/** False when values are only kept in memory (IndexedDB missing or blocked). */
export async function isLocalStateDurable(): Promise<boolean> {
    return (await openDb()) !== null
}

/** Tests only. */
export function __resetLocalState(): void {
    memory.clear()
    openedDb?.close()
    openedDb = null
    dbPromise = null
}
