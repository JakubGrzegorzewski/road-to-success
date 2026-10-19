import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { eventBus, ITypesEnum } from '@/scripts/eventBus'
import { startEventBridge } from '@/scripts/store/events'
import { User } from '@/scripts/database/User'
import { RankInProgress } from '@/scripts/database/RankInProgress'
import { Task } from '@/scripts/database/Task'
import { freshDoc } from './helpers'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('Yjs → eventBus bridge', () => {
    it('emits one debounced db-update per changed map and nothing for reads', async () => {
        const doc = freshDoc()
        const stop = startEventBridge(doc, 20)
        const seen: ITypesEnum[] = []
        const handler = ({ type }: { type: ITypesEnum }) => seen.push(type)
        eventBus.on('db-update', handler)
        try {
            const u = await User.add({ fullName: 'A' })
            const rip = await RankInProgress.add({ rankId: 0, personId: u.id, mentorId: u.id })
            const t = await Task.add(rip.id)
            for (let i = 0; i < 5; i++) await Task.setContent(t.id, 'x'.repeat(i + 1))
            await wait(40)
            expect(seen.sort()).toEqual([ITypesEnum.ERankInProgress, ITypesEnum.ETask, ITypesEnum.EUser].sort())

            seen.length = 0
            await Task.getAll()
            await User.getAll()
            await wait(40)
            expect(seen).toEqual([])

            // remote changes (applyUpdate) are reported too
            const other = new Y.Doc()
            other.getMap('people').set('remote', new Y.Map())
            Y.applyUpdate(doc, Y.encodeStateAsUpdate(other))
            await wait(40)
            expect(seen).toEqual([ITypesEnum.EUser])
        } finally {
            eventBus.off('db-update', handler)
            stop()
        }
    })
})
