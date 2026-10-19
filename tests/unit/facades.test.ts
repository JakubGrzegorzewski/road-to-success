import { beforeEach, describe, expect, it } from 'vitest'
import { Status } from '@/scripts/interfaces'
import { User } from '@/scripts/database/User'
import { RankInProgress } from '@/scripts/database/RankInProgress'
import { Task } from '@/scripts/database/Task'
import { TaskComment } from '@/scripts/database/TaskComment'
import { Rank } from '@/scripts/database/Rank'
import { Requirement } from '@/scripts/database/Requirement'
import { getMaps } from '@/scripts/store/doc'
import { freshDoc, seedAdvancement } from './helpers'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('static catalog', () => {
    it('maps every requirement to an existing rank (rankId = Rank.id)', () => {
        for (const r of Requirement.list()) expect(Rank.find(r.rankId)).toBeDefined()
        expect(Requirement.findByRankId(0)).toHaveLength(20)
        expect(Requirement.findByRankId(1).map((r) => r.id)).toContain(2016)
        expect(new Set(Requirement.list().map((r) => r.id)).size).toBe(Requirement.list().length)
    })
})

describe('User facade', () => {
    beforeEach(() => {
        freshDoc()
    })

    it('adds people with UUIDs and sorts them by name', async () => {
        const b = await User.add({ fullName: '  Zenon  ' })
        const a = await User.add({ fullName: 'Ala' })
        expect(a.id).toMatch(UUID)
        expect(b.fullName).toBe('Zenon')
        expect((await User.getAll()).map((u) => u.fullName)).toEqual(['Ala', 'Zenon'])
        await User.update({ id: a.id, fullName: 'Alicja' })
        expect((await User.getById(a.id)).fullName).toBe('Alicja')
        await User.deleteObject(b.id)
        expect(await User.findById(b.id)).toBeUndefined()
        await expect(User.getById(b.id)).rejects.toThrow('not found')
    })
})

describe('RankInProgress facade', () => {
    beforeEach(() => {
        freshDoc()
    })

    it('creates a default advancement for the first person', async () => {
        await expect(RankInProgress.addDefault()).rejects.toThrow('No users')
        const u = await User.add({ fullName: 'Ola' })
        const rip = await RankInProgress.addDefault()
        expect(rip).toMatchObject({ rankId: Rank.default().id, personId: u.id, mentorId: u.id })
        expect(await RankInProgress.getAll()).toHaveLength(1)
    })

    it('writes only changed fields and drops tasks when the rank changes', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const t1 = await Task.add(rip.id)
        await Task.add(rip.id)
        await TaskComment.add({ taskId: t1.id, authorId: mentor.id, content: 'ok' })

        await RankInProgress.update({ ...rip, mentorId: rip.personId })
        expect(await Task.getByRankInProgressId(rip.id)).toHaveLength(2)

        await RankInProgress.update({ ...rip, rankId: 1 })
        expect((await RankInProgress.getById(rip.id)).rankId).toBe(1)
        expect(await Task.getByRankInProgressId(rip.id)).toHaveLength(0)
        expect(getMaps().comments.size).toBe(0)
    })

    it('cascades deletes to tasks and comments in one transaction', async () => {
        const { rip, mentor } = await seedAdvancement()
        const t = await Task.add(rip.id)
        await TaskComment.add({ taskId: t.id, authorId: mentor.id, content: 'uwaga' })
        let transactions = 0
        const doc = getMaps().tasks.doc!
        doc.on('afterTransaction', () => transactions++)
        await RankInProgress.deleteObject(rip.id)
        expect(transactions).toBe(1)
        expect(getMaps().tasks.size).toBe(0)
        expect(getMaps().comments.size).toBe(0)
        expect(await RankInProgress.getAll()).toHaveLength(0)
    })

    it('reports which requirements of the rank are covered', async () => {
        const { rip } = await seedAdvancement(0)
        const t = await Task.add(rip.id)
        await Task.toggleRequirement(t.id, 1001)
        const statuses = await RankInProgress.getRequirementsStatuses(rip.id)
        expect(statuses).toHaveLength(20)
        expect(statuses.filter((s) => s.isCompleted).map((s) => s.requirement.id)).toEqual([1001])
    })
})

describe('Task facade', () => {
    beforeEach(() => {
        freshDoc()
    })

    it('starts with the whole idea and keeps creation order', async () => {
        const { rip } = await seedAdvancement(0)
        const a = await Task.add(rip.id)
        const b = await Task.add(rip.id)
        expect(a.partIdea).toEqual(Rank.default().idea.split(' '))
        expect(a.status).toBe(Status.CREATED)
        expect(b.order).toBe(a.order + 1)
        expect((await Task.getByRankInProgressId(rip.id)).map((t) => t.id)).toEqual([a.id, b.id])
    })

    it('stores requirements as a set', async () => {
        const { rip } = await seedAdvancement(0)
        const t = await Task.add(rip.id)
        await Task.toggleRequirement(t.id, 1005, true)
        await Task.toggleRequirement(t.id, 1005, true)
        await Task.toggleRequirement(t.id, 1001)
        expect((await Task.getById(t.id)).requirementIds).toEqual([1001, 1005])
        await Task.toggleRequirement(t.id, 1001)
        expect((await Task.getById(t.id)).requirementIds).toEqual([1005])
    })

    it('update() applies differences only (content as text diff)', async () => {
        const { rip } = await seedAdvancement(0)
        const t = await Task.add(rip.id)
        await Task.setContent(t.id, 'Zorganizuję biwak')
        const text = Task.contentText(t.id)!
        const changes: unknown[] = []
        text.observe((e) => changes.push(e.delta))
        const current = await Task.getById(t.id)
        await Task.update({ ...current, content: 'Zorganizuję biwak drużyny', status: Status.IN_PROGRESS, requirementIds: [1002] })
        expect(changes).toEqual([[{ retain: 17 }, { insert: ' drużyny' }]])
        expect(await Task.getById(t.id)).toMatchObject({ content: 'Zorganizuję biwak drużyny', status: Status.IN_PROGRESS, requirementIds: [1002] })
    })

    it('deletes a task with its comments and hides orphans', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const t = await Task.add(rip.id)
        const keep = await Task.add(rip.id)
        await TaskComment.add({ taskId: t.id, authorId: mentor.id, content: 'a' })
        await TaskComment.add({ taskId: keep.id, authorId: mentor.id, content: 'b' })
        await Task.deleteObject(t.id)
        expect((await TaskComment.getAll()).map((c) => c.content)).toEqual(['b'])
        await expect(Task.deleteObject(t.id)).rejects.toThrow('not found')

        // a task whose advancement disappeared (concurrent delete on another device)
        getMaps().ranksInProgress.delete(rip.id)
        expect(await Task.getAll()).toHaveLength(0)
        expect(await TaskComment.getAll()).toHaveLength(0)
    })
})
