import * as Y from 'yjs'
import type { CommentTarget, CommentTargetType, IComment, ITaskComment } from '../interfaces'
import { getDoc, getMaps, LOCAL_ORIGIN, readNumber, readString, type DocMaps, type RecordMap } from '../store/doc'
import { newId } from '../store/ids'
import { storeReady } from '../store/persistence'
import { Rank } from './Rank'
import { Requirement } from './Requirement'

const TARGET_TYPES: readonly CommentTargetType[] = ['task', 'requirement', 'advancement']

function isTargetType(v: unknown): v is CommentTargetType {
    return typeof v === 'string' && (TARGET_TYPES as readonly string[]).includes(v)
}

/**
 * Reads a record and normalises old ones: a comment without `targetType` (written before comments
 * had targets, or migrated from Dexie) is a task comment, and its advancement comes from the task.
 * Nothing is rewritten in the document.
 */
export function readComment(id: string, m: RecordMap, maps: Pick<DocMaps, 'tasks' | 'people'> = getMaps()): IComment {
    const taskId = readString(m, 'taskId')
    const rawType = m.get('targetType')
    const targetType: CommentTargetType = isTargetType(rawType) ? rawType : 'task'
    const targetId = targetType === 'advancement' ? '' : readString(m, 'targetId') || (targetType === 'task' ? taskId : '')
    let rankInProgressId = readString(m, 'rankInProgressId')
    if (!rankInProgressId && targetType === 'task') {
        const task = maps.tasks.get(targetId)
        if (task) rankInProgressId = readString(task, 'rankInProgressId')
    }
    const authorId = readString(m, 'authorId')
    const authorName = readString(m, 'authorName') || (maps.people.get(authorId) ? readString(maps.people.get(authorId)!, 'fullName') : '')
    const comment: IComment = {
        id,
        rankInProgressId,
        targetType,
        targetId,
        authorId,
        authorName,
        date: readString(m, 'date'),
        content: readString(m, 'content'),
        resolved: m.get('resolved') === true,
    }
    if (targetType === 'task') comment.taskId = targetId
    const editedAt = readString(m, 'editedAt')
    if (editedAt) comment.editedAt = editedAt
    if (comment.resolved) {
        const resolvedAt = readString(m, 'resolvedAt')
        const resolvedById = readString(m, 'resolvedById')
        if (resolvedAt) comment.resolvedAt = resolvedAt
        if (resolvedById) comment.resolvedById = resolvedById
    }
    return comment
}

/**
 * Orphans are hidden on read (like tasks): a comment is visible only while its advancement exists,
 * for a task comment also its task, and for a requirement comment while the requirement belongs to
 * the advancement's current rank (changing the rank orphans them).
 */
export function isCommentVisible(c: IComment, maps: Pick<DocMaps, 'tasks' | 'ranksInProgress'> = getMaps()): boolean {
    const rip = maps.ranksInProgress.get(c.rankInProgressId)
    if (!rip) return false
    if (c.targetType === 'task') {
        const task = maps.tasks.get(c.targetId)
        return !!task && readString(task, 'rankInProgressId') === c.rankInProgressId
    }
    if (c.targetType === 'requirement') {
        const requirement = Requirement.find(Number(c.targetId))
        return !!requirement && requirement.rankId === readNumber(rip, 'rankId', Rank.default().id)
    }
    return true
}

const byDate = (a: IComment, b: IComment) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)

function visibleComments(filter: (c: IComment) => boolean = () => true): IComment[] {
    const maps = getMaps()
    const out: IComment[] = []
    maps.comments.forEach((m, id) => {
        const c = readComment(id, m, maps)
        if (filter(c) && isCommentVisible(c, maps)) out.push(c)
    })
    return out.sort(byDate)
}

/** Must run inside a transaction (cascades): deletes the matching comments. */
export function deleteCommentsWhere(predicate: (comment: IComment) => boolean): number {
    const maps = getMaps()
    const doomed: string[] = []
    maps.comments.forEach((m, id) => {
        if (predicate(readComment(id, m, maps))) doomed.push(id)
    })
    doomed.forEach((id) => maps.comments.delete(id))
    return doomed.length
}

// ---------------------------------------------------------------- pure helpers (no document)

export type CommentTargetKey = `task:${string}` | `req:${number}` | 'adv'

export function targetKey(target: CommentTarget): CommentTargetKey {
    if (target.type === 'task') return `task:${target.id}`
    if (target.type === 'requirement') return `req:${target.id}`
    return 'adv'
}

export function targetFromKey(key: CommentTargetKey): CommentTarget {
    if (key.startsWith('task:')) return { type: 'task', id: key.slice(5) }
    if (key.startsWith('req:')) return { type: 'requirement', id: Number(key.slice(4)) }
    return { type: 'advancement' }
}

export function commentTarget(c: Pick<IComment, 'targetType' | 'targetId'>): CommentTarget {
    if (c.targetType === 'task') return { type: 'task', id: c.targetId }
    if (c.targetType === 'requirement') return { type: 'requirement', id: Number(c.targetId) }
    return { type: 'advancement' }
}

export function commentTargetKey(c: Pick<IComment, 'targetType' | 'targetId'>): CommentTargetKey {
    return targetKey(commentTarget(c))
}

/** Comments grouped by what they are pinned to; each group keeps the input order. */
export function groupByTarget(comments: readonly IComment[]): Map<CommentTargetKey, IComment[]> {
    const groups = new Map<CommentTargetKey, IComment[]>()
    for (const c of comments) {
        const key = commentTargetKey(c)
        const list = groups.get(key)
        if (list) list.push(c)
        else groups.set(key, [c])
    }
    return groups
}

export function openCount(comments: readonly Pick<IComment, 'resolved'>[]): number {
    return comments.reduce((n, c) => n + (c.resolved ? 0 : 1), 0)
}

/** Written by someone else after this device last left the advancement. */
export function isNewComment(c: Pick<IComment, 'authorId' | 'date'>, seenAt: number | undefined, myAuthorId: string | undefined): boolean {
    if (myAuthorId && c.authorId === myAuthorId) return false
    if (seenAt === undefined) return true
    const t = Date.parse(c.date)
    return Number.isFinite(t) && t > seenAt
}

/** "Opiekun" / "Podopieczny" is derived from the advancement, never stored. */
export function authorRole(authorId: string, rip: { mentorId: string; personId: string } | undefined | null): 'mentor' | 'mentee' | null {
    if (!rip || !authorId) return null
    if (authorId === rip.mentorId) return 'mentor'
    if (authorId === rip.personId) return 'mentee'
    return null
}

// ---------------------------------------------------------------- facade

export interface NewComment {
    rankInProgressId: string;
    target: CommentTarget;
    authorId: string;
    content: string;
    /** Tests/imports only. */
    id?: string;
    date?: string;
}

/** Shape accepted by the pre-targets API (TaskComment.add). */
export type LegacyNewComment = Omit<ITaskComment, 'id' | 'date'> & { id?: string; date?: string }

function commentMap(id: string): RecordMap {
    const m = getMaps().comments.get(id)
    if (!m) throw new Error(`comment with id ${id} not found`)
    return m
}

/**
 * Comments on an advancement, its tasks and its requirements — `comments` map of the Yjs document.
 * Content is a plain string (one author, last writer wins); `resolved` is a scalar (LWW).
 */
export class Comment {
    /** Every visible comment (all advancements). */
    static async getAll(): Promise<IComment[]> {
        await storeReady()
        return visibleComments()
    }

    /** Visible comments of one advancement (tasks, requirements, general notes), oldest first. */
    static async getByRankInProgressId(rankInProgressId: string): Promise<IComment[]> {
        await storeReady()
        return visibleComments((c) => c.rankInProgressId === rankInProgressId)
    }

    static async findById(id: string): Promise<IComment | undefined> {
        await storeReady()
        const m = getMaps().comments.get(id)
        return m ? readComment(id, m) : undefined
    }

    static async getById(id: string): Promise<IComment> {
        const c = await Comment.findById(id)
        if (!c) throw new Error(`comment with id ${id} not found`)
        return c
    }

    /** Task comments by task id (compatibility API). */
    static async getByTaskId(taskId: string): Promise<IComment[]> {
        await storeReady()
        const maps = getMaps()
        const out: IComment[] = []
        maps.comments.forEach((m, id) => {
            const c = readComment(id, m, maps)
            if (c.targetType === 'task' && c.targetId === taskId) out.push(c)
        })
        return out.sort(byDate)
    }

    static async add(input: NewComment | LegacyNewComment): Promise<IComment> {
        await storeReady()
        const maps = getMaps()
        const legacy = !('target' in input)
        const target: CommentTarget = legacy ? { type: 'task', id: (input as LegacyNewComment).taskId } : (input as NewComment).target
        let rankInProgressId = legacy ? '' : (input as NewComment).rankInProgressId
        if (target.type === 'task') {
            const task = maps.tasks.get(target.id)
            if (task) rankInProgressId ||= readString(task, 'rankInProgressId')
        }
        if (!legacy && !input.content.trim()) throw new Error('comment content is empty')
        const person = maps.people.get(input.authorId)
        const id = input.id ?? newId()
        const date = input.date ?? new Date().toISOString()
        const targetId = target.type === 'advancement' ? '' : String(target.id)
        getDoc().transact(() => {
            const m = new Y.Map<unknown>()
            maps.comments.set(id, m)
            m.set('rankInProgressId', rankInProgressId)
            m.set('targetType', target.type)
            m.set('targetId', targetId)
            if (target.type === 'task') m.set('taskId', targetId)
            m.set('authorId', input.authorId)
            m.set('authorName', person ? readString(person, 'fullName') : '')
            m.set('date', date)
            m.set('content', legacy ? input.content : input.content.trim())
            m.set('resolved', false)
        }, LOCAL_ORIGIN)
        return readComment(id, maps.comments.get(id)!, maps)
    }

    /** Replaces the text (the UI offers this to the author only) and stamps `editedAt`. */
    static async edit(id: string, content: string): Promise<void> {
        await storeReady()
        const m = commentMap(id)
        const text = content.trim()
        if (!text) throw new Error('comment content is empty')
        if (readString(m, 'content') === text) return
        getDoc().transact(() => {
            m.set('content', text)
            m.set('editedAt', new Date().toISOString())
        }, LOCAL_ORIGIN)
    }

    /**
     * "Załatwione" / "Otwórz ponownie". All three fields are written in both directions (null instead
     * of deleting), so concurrent resolve/reopen on two devices settles on one consistent state.
     */
    static async setResolved(id: string, resolved: boolean, byId: string): Promise<void> {
        await storeReady()
        const m = commentMap(id)
        if ((m.get('resolved') === true) === resolved) return
        getDoc().transact(() => {
            m.set('resolved', resolved)
            m.set('resolvedAt', resolved ? new Date().toISOString() : null)
            m.set('resolvedById', resolved ? byId : null)
        }, LOCAL_ORIGIN)
    }

    /** Compatibility API (TaskComment.update): content and date. */
    static async update(comment: Pick<ITaskComment, 'id' | 'content' | 'date'>): Promise<typeof comment | undefined> {
        await storeReady()
        const m = getMaps().comments.get(comment.id)
        if (!m) return undefined
        getDoc().transact(() => {
            if (readString(m, 'content') !== comment.content) {
                m.set('content', comment.content)
                m.set('editedAt', new Date().toISOString())
            }
            if (readString(m, 'date') !== comment.date) m.set('date', comment.date)
        }, LOCAL_ORIGIN)
        return comment
    }

    static async deleteObject(id: string): Promise<void> {
        await storeReady()
        getDoc().transact(() => getMaps().comments.delete(id), LOCAL_ORIGIN)
    }

    /** Requirement comments that changing the advancement's rank to `newRankId` would hide (and delete). */
    static async countLostOnRankChange(rankInProgressId: string, newRankId: number): Promise<number> {
        const comments = await Comment.getByRankInProgressId(rankInProgressId)
        return comments.filter((c) => c.targetType === 'requirement' && Requirement.find(Number(c.targetId))?.rankId !== newRankId).length
    }
}
