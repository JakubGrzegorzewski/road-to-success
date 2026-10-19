import { beforeEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import * as Y from 'yjs'
import { Status } from '@/scripts/interfaces'
import { Rank } from '@/scripts/database/Rank'
import { User } from '@/scripts/database/User'
import { RankInProgress } from '@/scripts/database/RankInProgress'
import { Task } from '@/scripts/database/Task'
import { TaskComment } from '@/scripts/database/TaskComment'
import { Comment, groupByTarget } from '@/scripts/database/Comment'
import { getMaps } from '@/scripts/store/doc'
import { __resetLocalState, getLocal } from '@/scripts/store/localState'
import { LEGACY_DB_NAME, migrateFromDexie, readLegacySnapshot } from '@/scripts/store/migrateFromDexie'
import { freshDoc } from './helpers'

const idea = Rank.find(0)!.idea

/** Recreates the database written by version 1.x (Dexie schema v1, numeric ++id keys). */
async function createLegacyDatabase() {
    const db = new Dexie(LEGACY_DB_NAME)
    db.version(1).stores({
        users: '++id',
        ranks: '++id',
        ranksInProgress: '++id, rankId, userId, mentorId',
        requirements: '++id, rankId',
        tasks: '++id, rankInProgressId',
        taskComments: '++id, taskId, userId',
    })
    await db.table('ranks').bulkPut([{ id: 0, fullName: 'Przewodnik', idea, requirementIds: [] }])
    await db.table('users').bulkAdd([
        { fullName: 'pwd. Jan Kowalski HO', ranksInProgressIds: [1], mentorRanksInProgressIds: [], commentIds: [] },
        { fullName: 'hm. Anna Nowak', ranksInProgressIds: [], mentorRanksInProgressIds: [1, 2], commentIds: [1] },
    ])
    await db.table('ranksInProgress').bulkAdd([
        { rankId: 0, userId: 1, mentorId: 2, taskIds: [1, 2] },
        { rankId: 3, userId: 2, mentorId: 2, taskIds: [3] },
    ])
    await db.table('tasks').bulkAdd([
        {
            rankInProgressId: 1,
            requirementsIds: [1001, 1005, 1005],
            content: 'Poprowadzę zbiórkę o Prawie Harcerskim',
            status: Status.IN_PROGRESS,
            partIdea: ['Jest wzorem dla harcerzy.'],
            commentIds: [1],
        },
        { rankInProgressId: 1, requirementsIds: [], content: '', status: Status.CREATED, partIdea: idea.split(' '), commentIds: [] },
        { rankInProgressId: 2, requirementsIds: [45], content: 'Zadanie HO', status: 'NOT_A_STATUS', partIdea: [], commentIds: [] },
        // orphan: points at an advancement that no longer exists
        { rankInProgressId: 99, requirementsIds: [], content: 'sierota', status: Status.CREATED, partIdea: [], commentIds: [] },
    ])
    await db.table('taskComments').bulkAdd([{ date: '2026-03-01T10:00:00.000Z', content: 'Dobry pomysł', taskId: 1, userId: 2 }])
    db.close()
}

async function deleteDb(name: string) {
    await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(name)
        req.onsuccess = req.onerror = req.onblocked = () => resolve()
    })
}

describe('migration from Dexie (RoadSuccessDB)', () => {
    beforeEach(async () => {
        __resetLocalState()
        await deleteDb(LEGACY_DB_NAME)
        await deleteDb('road-to-success-device')
    })

    it('does nothing (and creates nothing) when there is no old database', async () => {
        const doc = freshDoc()
        expect(await migrateFromDexie(doc)).toBeNull()
        expect(await Dexie.exists(LEGACY_DB_NAME)).toBe(false)
        expect((await getLocal('dexieMigration'))?.status).toBe('nothing-to-migrate')
    })

    it('rewrites ids, foreign keys and sets in one transaction', async () => {
        await createLegacyDatabase()
        const doc = freshDoc()
        let transactions = 0
        doc.on('afterTransaction', () => transactions++)

        const result = await migrateFromDexie(doc)
        expect(result).toEqual({ people: 2, ranksInProgress: 2, tasks: 3, comments: 1, skipped: 1 })
        expect(transactions).toBe(1)

        const people = await User.getAll()
        expect(people.map((p) => p.fullName)).toEqual(['hm. Anna Nowak', 'pwd. Jan Kowalski HO'])
        const [anna, jan] = people

        const rips = await RankInProgress.getAll()
        expect(rips).toHaveLength(2)
        expect(rips[0]).toMatchObject({ rankId: 0, personId: jan!.id, mentorId: anna!.id })
        expect(rips[1]).toMatchObject({ rankId: 3, personId: anna!.id, mentorId: anna!.id })
        expect(rips[0]!.createdAt).toBeLessThan(rips[1]!.createdAt)

        const tasks = await Task.getByRankInProgressId(rips[0]!.id)
        expect(tasks.map((t) => t.content)).toEqual(['Poprowadzę zbiórkę o Prawie Harcerskim', ''])
        expect(tasks[0]).toMatchObject({ requirementIds: [1001, 1005], status: Status.IN_PROGRESS, partIdea: ['Jest wzorem dla harcerzy.'] })
        expect(getMaps(doc).tasks.get(tasks[0]!.id)!.get('content')).toBeInstanceOf(Y.Text)
        expect((await Task.getByRankInProgressId(rips[1]!.id))[0]!.status).toBe(Status.CREATED)

        const comments = await TaskComment.getByTaskId(tasks[0]!.id)
        expect(comments).toMatchObject([{ authorId: anna!.id, content: 'Dobry pomysł', date: '2026-03-01T10:00:00.000Z' }])
        // …and shows up in the task's thread of the advancement view
        const thread = groupByTarget(await Comment.getByRankInProgressId(rips[0]!.id)).get(`task:${tasks[0]!.id}`)
        expect(thread).toMatchObject([{ targetType: 'task', rankInProgressId: rips[0]!.id, authorName: 'hm. Anna Nowak', resolved: false, content: 'Dobry pomysł' }])

        // reverse arrays are gone
        for (const [, m] of getMaps(doc).people) expect(m.has('ranksInProgressIds')).toBe(false)
        for (const [, m] of getMaps(doc).ranksInProgress) expect(m.has('taskIds')).toBe(false)
    })

    it('runs once per device and keeps the old database as a backup', async () => {
        await createLegacyDatabase()
        const doc = freshDoc()
        await migrateFromDexie(doc)
        expect(await migrateFromDexie(doc)).toBeNull()
        expect(getMaps(doc).people.size).toBe(2)
        expect(await Dexie.exists(LEGACY_DB_NAME)).toBe(true)
        expect((await readLegacySnapshot())!.users).toHaveLength(2)
    })

    it('does not migrate twice when only the "done" marker was lost', async () => {
        await createLegacyDatabase()
        const doc = freshDoc()
        const snapshot = await readLegacySnapshot()
        // simulate a crash after the document was written but before "done" was stored
        const { setLocal } = await import('@/scripts/store/localState')
        await setLocal('dexieMigration', { id: 'run-1', status: 'started', at: 1 })
        const { migrateLegacySnapshot } = await import('@/scripts/store/migrateFromDexie')
        migrateLegacySnapshot(doc, snapshot!, 'run-1')
        expect(await migrateFromDexie(doc)).toBeNull()
        expect(getMaps(doc).people.size).toBe(2)
        expect((await getLocal('dexieMigration'))?.status).toBe('done')
    })
})
