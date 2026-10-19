import { beforeEach, describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import type { IComment } from '@/scripts/interfaces'
import { User } from '@/scripts/database/User'
import { RankInProgress } from '@/scripts/database/RankInProgress'
import { Task } from '@/scripts/database/Task'
import { TaskComment } from '@/scripts/database/TaskComment'
import {
    authorRole,
    Comment,
    commentTargetKey,
    groupByTarget,
    isNewComment,
    openCount,
    targetKey,
} from '@/scripts/database/Comment'
import { Requirement } from '@/scripts/database/Requirement'
import { getMaps, LOCAL_ORIGIN } from '@/scripts/store/doc'
import { freshDoc, seedAdvancement } from './helpers'

describe('Comment facade', () => {
    beforeEach(() => {
        freshDoc()
    })

    it('adds comments to a task, a requirement and the advancement', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const task = await Task.add(rip.id)
        const onTask = await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: task.id }, authorId: mentor.id, content: '  Doprecyzuj termin.  ' })
        const onReq = await Comment.add({ rankInProgressId: rip.id, target: { type: 'requirement', id: 1003 }, authorId: mentor.id, content: 'Brakuje zadania' })
        const general = await Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: 'Dobry start' })

        expect(onTask).toMatchObject({ targetType: 'task', targetId: task.id, taskId: task.id, content: 'Doprecyzuj termin.', resolved: false, authorName: 'hm. Anna Nowak' })
        expect(onReq).toMatchObject({ targetType: 'requirement', targetId: '1003', rankInProgressId: rip.id })
        expect(onReq.taskId).toBeUndefined()
        expect(general).toMatchObject({ targetType: 'advancement', targetId: '' })
        expect((await Comment.getByRankInProgressId(rip.id)).map((c) => c.id).sort()).toEqual([onTask.id, onReq.id, general.id].sort())
        await expect(Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: '   ' })).rejects.toThrow('empty')
    })

    it('edits, resolves, reopens and deletes', async () => {
        const { rip, mentor, mentee } = await seedAdvancement(0)
        const c = await Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: 'a' })
        await Comment.edit(c.id, 'b')
        let read = await Comment.getById(c.id)
        expect(read.content).toBe('b')
        expect(read.editedAt).toBeDefined()

        await Comment.setResolved(c.id, true, mentee.id)
        read = await Comment.getById(c.id)
        expect(read).toMatchObject({ resolved: true, resolvedById: mentee.id })
        expect(read.resolvedAt).toBeDefined()

        await Comment.setResolved(c.id, false, mentor.id)
        read = await Comment.getById(c.id)
        expect(read.resolved).toBe(false)
        expect(read.resolvedAt).toBeUndefined()
        expect(read.resolvedById).toBeUndefined()

        await Comment.deleteObject(c.id)
        expect(await Comment.findById(c.id)).toBeUndefined()
    })

    it('keeps the author name when the person is deleted', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const c = await Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: 'x' })
        await User.deleteObject(mentor.id)
        expect((await Comment.getById(c.id)).authorName).toBe('hm. Anna Nowak')
    })

    it('reads records written before comment targets as task comments', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const task = await Task.add(rip.id)
        const doc = getMaps().comments.doc!
        doc.transact(() => {
            const m = new Y.Map<unknown>()
            getMaps().comments.set('old', m)
            m.set('taskId', task.id)
            m.set('authorId', mentor.id)
            m.set('date', '2026-03-01T10:00:00.000Z')
            m.set('content', 'Stary komentarz')
        }, LOCAL_ORIGIN)
        const [c] = await Comment.getByRankInProgressId(rip.id)
        expect(c).toMatchObject({ id: 'old', targetType: 'task', targetId: task.id, taskId: task.id, rankInProgressId: rip.id, resolved: false, authorName: 'hm. Anna Nowak' })
        // nothing is rewritten in place
        expect(getMaps().comments.get('old')!.has('targetType')).toBe(false)
        // the compatibility API still works
        expect((await TaskComment.getByTaskId(task.id)).map((x) => x.content)).toEqual(['Stary komentarz'])
        await TaskComment.add({ taskId: task.id, authorId: mentor.id, content: 'nowy' })
        expect((await Comment.getByRankInProgressId(rip.id)).map((x) => x.content)).toEqual(['Stary komentarz', 'nowy'])
    })

    it('hides orphans: missing task, missing advancement, requirement of another rank', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const task = await Task.add(rip.id)
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: task.id }, authorId: mentor.id, content: 't' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'requirement', id: 2016 }, authorId: mentor.id, content: 'other rank' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'requirement', id: 1001 }, authorId: mentor.id, content: 'r' })
        expect((await Comment.getByRankInProgressId(rip.id)).map((c) => c.content).sort()).toEqual(['r', 't'])

        // concurrent deletes on another device arrive without the cascade
        getMaps().tasks.delete(task.id)
        expect((await Comment.getByRankInProgressId(rip.id)).map((c) => c.content)).toEqual(['r'])
        getMaps().ranksInProgress.delete(rip.id)
        expect(await Comment.getAll()).toHaveLength(0)
    })

    it('cascades: task delete removes its comments, advancement delete removes all of them in one transaction', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const t1 = await Task.add(rip.id)
        const t2 = await Task.add(rip.id)
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: t1.id }, authorId: mentor.id, content: '1' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'task', id: t2.id }, authorId: mentor.id, content: '2' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'requirement', id: 1001 }, authorId: mentor.id, content: 'r' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: 'g' })
        await Task.deleteObject(t1.id)
        expect(getMaps().comments.size).toBe(3)

        let transactions = 0
        getMaps().comments.doc!.on('afterTransaction', () => transactions++)
        await RankInProgress.deleteObject(rip.id)
        expect(transactions).toBe(1)
        expect(getMaps().comments.size).toBe(0)
    })

    it('changing the rank deletes requirement comments (counted beforehand) and keeps general notes', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'requirement', id: 1001 }, authorId: mentor.id, content: 'r1' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'requirement', id: 1002 }, authorId: mentor.id, content: 'r2' })
        await Comment.add({ rankInProgressId: rip.id, target: { type: 'advancement' }, authorId: mentor.id, content: 'g' })
        expect(await Comment.countLostOnRankChange(rip.id, 0)).toBe(0)
        expect(await Comment.countLostOnRankChange(rip.id, 1)).toBe(2)

        await RankInProgress.update({ ...rip, rankId: 1 })
        expect((await Comment.getByRankInProgressId(rip.id)).map((c) => c.content)).toEqual(['g'])
        expect(getMaps().comments.size).toBe(1)
    })

    it('visible task comments come from TaskComment.getAll too (compatibility)', async () => {
        const { rip, mentor } = await seedAdvancement(0)
        const t = await Task.add(rip.id)
        await TaskComment.add({ taskId: t.id, authorId: mentor.id, content: 'k' })
        expect(await TaskComment.getAll()).toHaveLength(1)
        expect((await TaskComment.getAll())[0]!.rankInProgressId).toBe(rip.id)
    })
})

describe('comment helpers (pure)', () => {
    const base: IComment = {
        id: 'x',
        rankInProgressId: 'r',
        targetType: 'task',
        targetId: 't1',
        taskId: 't1',
        authorId: 'a',
        authorName: 'A',
        date: '2026-10-01T10:00:00.000Z',
        content: '',
        resolved: false,
    }
    const c = (extra: Partial<IComment>): IComment => ({ ...base, ...extra })

    it('groups by target and counts open comments', () => {
        const list = [
            c({ id: '1' }),
            c({ id: '2', resolved: true }),
            c({ id: '3', targetType: 'requirement', targetId: '1005', taskId: undefined }),
            c({ id: '4', targetType: 'advancement', targetId: '', taskId: undefined }),
            c({ id: '5', targetId: 't2', taskId: 't2' }),
        ]
        const groups = groupByTarget(list)
        expect([...groups.keys()]).toEqual(['task:t1', 'req:1005', 'adv', 'task:t2'])
        expect(groups.get('task:t1')!.map((x) => x.id)).toEqual(['1', '2'])
        expect(openCount(groups.get('task:t1')!)).toBe(1)
        expect(openCount(list)).toBe(4)
        expect(targetKey({ type: 'requirement', id: 1005 })).toBe('req:1005')
        expect(commentTargetKey(list[3]!)).toBe('adv')
    })

    it('marks comments of other authors newer than the last visit as new', () => {
        const seen = Date.parse('2026-10-01T09:00:00.000Z')
        expect(isNewComment(c({}), seen, 'me')).toBe(true)
        expect(isNewComment(c({ authorId: 'me' }), seen, 'me')).toBe(false)
        expect(isNewComment(c({ date: '2026-10-01T08:00:00.000Z' }), seen, 'me')).toBe(false)
        expect(isNewComment(c({}), undefined, 'me')).toBe(true)
    })

    it('derives the role label from the advancement', () => {
        const rip = { mentorId: 'm', personId: 'p' }
        expect(authorRole('m', rip)).toBe('mentor')
        expect(authorRole('p', rip)).toBe('mentee')
        expect(authorRole('x', rip)).toBeNull()
        expect(authorRole('m', null)).toBeNull()
    })

    it('requirement ids are unique across ranks (a requirement comment cannot jump to another rank)', () => {
        const ids = Requirement.list().map((r) => r.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})
