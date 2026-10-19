import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { __setDoc } from '@/scripts/store/doc'
import { __resetStore, destroyLocalDocument, initStore } from '@/scripts/store/persistence'
import { __resetLocalState, setLocal } from '@/scripts/store/localState'
import { User } from '@/scripts/database/User'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function reload() {
    __resetStore()
    __resetLocalState()
    __setDoc(new Y.Doc())
    await initStore()
}

describe('"start from the room\'s data"', () => {
    beforeEach(async () => {
        __resetStore()
        __resetLocalState()
        __setDoc(new Y.Doc())
    })
    afterEach(() => {
        __resetStore()
        __resetLocalState()
    })

    it('deletes the local document database (no deletions are recorded in the CRDT)', async () => {
        await initStore()
        await User.add({ fullName: 'Lokalna osoba' })
        await setLocal('deviceName', 'Telefon')
        await wait(20)
        await destroyLocalDocument()
        await reload()
        expect(await User.getAll()).toEqual([])
        // per-device state (room, migration marker, device name…) is kept
        const { getLocal } = await import('@/scripts/store/localState')
        expect(await getLocal('deviceName')).toBe('Telefon')
    })
})
