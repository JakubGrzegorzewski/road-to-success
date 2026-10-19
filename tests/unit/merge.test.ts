import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { Status } from '@/scripts/interfaces'
import { User } from '@/scripts/database/User'
import { RankInProgress } from '@/scripts/database/RankInProgress'
import { Task } from '@/scripts/database/Task'
import { TaskComment } from '@/scripts/database/TaskComment'
import { Comment } from '@/scripts/database/Comment'
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
        const comments = await Comment.getAll()
        const c = rand()
        if (c < 0.5 || comments.length === 0) await TaskComment.add({ taskId: pick(rand, tasks)!.id, authorId: pick(rand, people)!.id, content: 'k' })
        else if (c < 0.7) await Comment.add({ rankInProgressId: pick(rand, rips)!.id, target: { type: 'advancement' }, authorId: pick(rand, people)!.id, content: 'g' })
        else if (c < 0.9) await Comment.setResolved(pick(rand, comments)!.id, rand() < 0.5, pick(rand, people)!.id)
        else await Comment.edit(pick(rand, comments)!.id, 'e' + Math.floor(rand() * 10))
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

describe('merging comments', () => {
    async function sharedAdvancement() {
        const a = freshDoc()
        const mentor = await User.add({ fullName: 'hm. Anna' })
        const mentee = await User.add({ fullName: 'Jan' })
        const rip = await RankInProgress.add({ rankId: 0, personId: mentee.id, mentorId: mentor.id })
        const task = await Task.add(rip.id)
        const b = new Y.Doc()
        syncDocs(a, b)
        return { a, b, mentor, mentee, rip, task }
    }

    it('comments added on two devices at the same time are both kept', async () => {
        const { a, b, mentor, mentee, rip, task } = await sharedAdvancement()
        freshDoc(a)
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: task.id }, authorId: mentor.id, content: 'Uwaga opiekuna' })
        freshDoc(b)
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: task.id }, authorId: mentee.id, content: 'Odpowiedź' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'requirement', id: 1001 }, authorId: mentee.id, content: 'Pytanie' })
        syncDocs(a, b)
        expect(snapshot(a)).toEqual(snapshot(b))
        for (const doc of [a, b]) {
            freshDoc(doc)
            expect((await Comment.getByRankInProgressId(rip.id)).map((c) => c.content).sort()).toEqual(['Odpowiedź', 'Pytanie', 'Uwaga opiekuna'])
        }
    })

    it('concurrent resolve and edit of one comment converge (both directions)', async () => {
        const { a, b, mentor, mentee, rip, task } = await sharedAdvancement()
        freshDoc(a)
        const c = await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: task.id }, authorId: mentor.id, content: 'Popraw opis' })
        syncDocs(a, b)

        freshDoc(a)
        await Comment.edit(c.id, 'Popraw opis zadania')
        freshDoc(b)
        await Comment.setResolved(c.id, true, mentee.id)

        const a2 = new Y.Doc()
        Y.applyUpdate(a2, Y.encodeStateAsUpdate(a))
        const b2 = new Y.Doc()
        Y.applyUpdate(b2, Y.encodeStateAsUpdate(b))
        Y.applyUpdate(a2, Y.encodeStateAsUpdate(b)) // B → A
        Y.applyUpdate(b2, Y.encodeStateAsUpdate(a)) // A → B
        expect(snapshot(a2)).toEqual(snapshot(b2))
        freshDoc(a2)
        expect(await Comment.getById(c.id)).toMatchObject({ content: 'Popraw opis zadania', resolved: true, resolvedById: mentee.id })
    })

    it('concurrent resolve and reopen settle on one consistent state', async () => {
        const { a, b, mentor, mentee, rip } = await sharedAdvancement()
        freshDoc(a)
        const c = await Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: 'x' })
        await Comment.setResolved(c.id, true, mentor.id)
        syncDocs(a, b)
        freshDoc(a)
        await Comment.setResolved(c.id, false, mentor.id)
        freshDoc(b)
        await Comment.setResolved(c.id, false, mentee.id)
        await Comment.setResolved(c.id, true, mentee.id)
        syncDocs(a, b)
        expect(snapshot(a)).toEqual(snapshot(b))
        freshDoc(a)
        const merged = await Comment.getById(c.id)
        // either outcome is fine, but the fields must agree with each other
        if (merged.resolved) expect(merged.resolvedAt).toBeDefined()
        else expect(merged.resolvedAt).toBeUndefined()
    })

    it('an advancement deleted on A while B comments leaves a hidden orphan on both', async () => {
        const { a, b, mentor, rip, task } = await sharedAdvancement()
        freshDoc(a)
        await RankInProgress.deleteObject(rip.id)
        freshDoc(b)
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: task.id }, authorId: mentor.id, content: 'spóźniona uwaga' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: 'ogólna' })
        syncDocs(a, b)
        expect(snapshot(a)).toEqual(snapshot(b))
        for (const doc of [a, b]) {
            freshDoc(doc)
            expect(await Comment.getAll()).toHaveLength(0)
            expect(await Comment.getByRankInProgressId(rip.id)).toHaveLength(0)
        }
    })
})
