import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import * as Y from 'yjs'
import { __setDoc, getMaps } from '@/scripts/store/doc'
import { __resetStore, initStore } from '@/scripts/store/persistence'
import { __resetLocalState } from '@/scripts/store/localState'
import { User } from '@/scripts/database/User'
import { appState } from '@/scripts/appState'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function deleteDb(name: string) {
    await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(name)
        req.onsuccess = req.onerror = req.onblocked = () => resolve()
    })
}

async function reload() {
    __resetStore()
    __resetLocalState()
    __setDoc(new Y.Doc())
    await initStore()
}

describe('local persistence (y-indexeddb)', () => {
    beforeEach(async () => {
        __resetStore()
        __resetLocalState()
        await deleteDb('road-to-success')
        await deleteDb('road-to-success-device')
        await deleteDb('RoadSuccessDB')
        __setDoc(new Y.Doc())
    })
    afterEach(() => {
        __resetStore()
        __resetLocalState()
    })

    it('keeps data across reloads', async () => {
        await initStore()
        expect(appState.storageMode).toBe('indexeddb')
        await User.add({ fullName: 'Trwała osoba' })
        await wait(20)
        await reload()
        expect((await User.getAll()).map((u) => u.fullName)).toEqual(['Trwała osoba'])
    })

    it('migrates the old Dexie database during the first start only', async () => {
        const old = new Dexie('RoadSuccessDB')
        old.version(1).stores({ users: '++id', ranksInProgress: '++id', tasks: '++id', taskComments: '++id' })
        await old.table('users').add({ fullName: 'Z wersji 1', ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] })
        old.close()

        await initStore()
        expect((await User.getAll()).map((u) => u.fullName)).toEqual(['Z wersji 1'])
        await wait(20)
        await reload()
        expect(await User.getAll()).toHaveLength(1)
        expect([...getMaps().meta.keys()].some((k) => k.startsWith('legacyImport:'))).toBe(true)
    })
})
