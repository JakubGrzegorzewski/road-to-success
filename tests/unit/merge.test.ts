import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { Status } from '@/scripts/interfaces'
import { User } from '@/scripts/database/User'
import { RankInProgress } from '@/scripts/database/RankInProgress'
import { Task } from '@/scripts/database/Task'
import { TaskComment } from '@/scripts/database/TaskComment'
import { freshDoc, snapshot, syncDocs } from './helpers'

/** Deterministic PRNG so failures are reproducible. */
function prng(seed: number) {
    let s = seed >>> 0
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 2 ** 32
    }
}

const pick = <T>(rand: () => number, xs: readonly T[]): T | undefined => xs[Math.floor(rand() * xs.length)]

async function randomEdit(rand: () => number) {
    const people = await User.getAll()
    const rips = await RankInProgress.getAll()
    const tasks = await Task.getAll()
    const r = rand()
    if (r < 0.1 || people.length === 0) {
        await User.add({ fullName: `Osoba ${Math.floor(rand() * 1000)}` })
    } else if (r < 0.2 || rips.length === 0) {
        const p = pick(rand, people)!
        await RankInProgress.add({ rankId: Math.floor(rand() * 3), personId: p.id, mentorId: pick(rand, people)!.id })
    } else if (r < 0.35 || tasks.length === 0) {
        await Task.add(pick(rand, rips)!.id)
    } else if (r < 0.55) {
        const t = pick(rand, tasks)!
        const text = Task.contentText(t.id)!
        const pos = Math.floor(rand() * (text.length + 1))
        if (rand() < 0.7 || text.length === 0) await Task.setContent(t.id, text.toString().slice(0, pos) + 'abc' + text.toString().slice(pos))
        else await Task.setContent(t.id, text.toString().slice(0, pos) + text.toString().slice(pos + 2))
    } else if (r < 0.7) {
        await Task.toggleRequirement(pick(rand, tasks)!.id, 1001 + Math.floor(rand() * 6))
    } else if (r < 0.78) {
        await Task.setStatus(pick(rand, tasks)!.id, pick(rand, [Status.CREATED, Status.IN_PROGRESS, Status.COMPLETED])!)
    } else if (r < 0.86) {
        await TaskComment.add({ taskId: pick(rand, tasks)!.id, authorId: pick(rand, people)!.id, content: 'k' })
    } else if (r < 0.92) {
        await Task.deleteObject(pick(rand, tasks)!.id)
    } else if (r < 0.96) {
        const rip = pick(rand, rips)!
        await RankInProgress.update({ ...rip, mentorId: pick(rand, people)!.id })
    } else {
        await RankInProgress.deleteObject(pick(rand, rips)!.id)
    }
}

describe('merging two independently edited documents', () => {
    it('converges after exchanging updates in both directions', async () => {
        const a = new Y.Doc()
        const b = new Y.Doc()
        freshDoc(a)
        const jan = await User.add({ fullName: 'Jan' })
        const rip = await RankInProgress.add({ rankId: 0, personId: jan.id, mentorId: jan.id })
        const task = await Task.add(rip.id)
        await Task.setContent(task.id, 'Biwak')
        syncDocs(a, b)

        // offline edits on both sides
        freshDoc(a)
        await Task.setContent(task.id, 'Biwak zastępu')
        await Task.toggleRequirement(task.id, 1001)
        freshDoc(b)
        await Task.setContent(task.id, 'Duży Biwak')
        await Task.toggleRequirement(task.id, 1002)
        await Task.toggleRequirement(task.id, 1001)

        syncDocs(a, b)
        expect(snapshot(a)).toEqual(snapshot(b))
        freshDoc(a)
        const merged = await Task.getById(task.id)
        expect(merged.content).toBe('Duży Biwak zastępu')
        expect(merged.requirementIds).toEqual([1001, 1002])
    })

    it('importing the same update twice changes nothing (idempotent)', async () => {
        const a = freshDoc()
        await User.add({ fullName: 'Ola' })
        const update = Y.encodeStateAsUpdate(a)
        const b = new Y.Doc()
        Y.applyUpdate(b, update)
        Y.applyUpdate(b, update)
        expect(snapshot(b)).toEqual(snapshot(a))
    })

    it('random concurrent edit sequences always converge', async () => {
        for (let seed = 1; seed <= 25; seed++) {
            const rand = prng(seed)
            const docs = [new Y.Doc(), new Y.Doc(), new Y.Doc()]
            for (let round = 0; round < 6; round++) {
                for (const doc of docs) {
                    freshDoc(doc)
                    const edits = 1 + Math.floor(rand() * 5)
                    for (let i = 0; i < edits; i++) await randomEdit(rand)
                }
                // gossip in a random pairwise order
                const [x, y] = [pick(rand, docs)!, pick(rand, docs)!]
                if (x !== y) syncDocs(x, y)
            }
            syncDocs(docs[0]!, docs[1]!)
            syncDocs(docs[1]!, docs[2]!)
            syncDocs(docs[0]!, docs[1]!)
            const expected = snapshot(docs[0]!)
            expect(snapshot(docs[1]!)).toEqual(expected)
            expect(snapshot(docs[2]!)).toEqual(expected)
        }
    })
})
