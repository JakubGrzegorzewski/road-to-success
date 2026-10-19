import * as Y from 'yjs'
import { isStatus, Status, type IRequirement, type ITask } from '../interfaces'
import {
    ensureNestedMap,
    ensureNestedText,
    getDoc,
    getMaps,
    LOCAL_ORIGIN,
    readNumber,
    readString,
    readStringArray,
    type RecordMap,
} from '../store/doc'
import { newId } from '../store/ids'
import { storeReady } from '../store/persistence'
import { applyStringToYText } from '../store/yText'
import { Rank } from './Rank'
import { Requirement } from './Requirement'

export function readTaskRequirementIds(m: RecordMap): number[] {
    const set = m.get('requirementIds')
    if (set instanceof Y.Map) {
        return [...set.keys()]
            .map(Number)
            .filter((n) => Number.isFinite(n))
            .sort((a, b) => a - b)
    }
    return []
}

function read(id: string, m: RecordMap): ITask {
    const status = m.get('status')
    return {
        id,
        rankInProgressId: readString(m, 'rankInProgressId'),
        requirementIds: readTaskRequirementIds(m),
        content: readString(m, 'content'),
        status: isStatus(status) ? status : Status.CREATED,
        partIdea: readStringArray(m, 'partIdea'),
        order: readNumber(m, 'order'),
        createdAt: readNumber(m, 'createdAt'),
    }
}

const byOrder = (a: ITask, b: ITask) => a.order - b.order || a.createdAt - b.createdAt || a.id.localeCompare(b.id)

/** Must run inside a transaction: deletes matching tasks and their comments. */
export function deleteTasksWhere(predicate: (task: RecordMap, id: string) => boolean): void {
    const { tasks, comments } = getMaps()
    const taskIds: string[] = []
    tasks.forEach((t, id) => {
        if (predicate(t, id)) taskIds.push(id)
    })
    if (taskIds.length === 0) return
    const doomed = new Set(taskIds)
    const commentIds: string[] = []
    comments.forEach((c, id) => {
        if (doomed.has(readString(c, 'taskId'))) commentIds.push(id)
    })
    commentIds.forEach((id) => comments.delete(id))
    taskIds.forEach((id) => tasks.delete(id))
}

function taskMap(id: string | undefined): RecordMap {
    if (!id) throw new Error('task id is undefined')
    const m = getMaps().tasks.get(id)
    if (!m) throw new Error(`task with id ${id} not found`)
    return m
}

/** Tasks of an advancement — `tasks` map of the Yjs document. */
export class Task {
    /** All tasks whose advancement still exists (orphans from concurrent deletes are hidden). */
    static async getAll(): Promise<ITask[]> {
        await storeReady()
        const { tasks, ranksInProgress } = getMaps()
        const out: ITask[] = []
        tasks.forEach((m, id) => {
            const task = read(id, m)
            if (ranksInProgress.has(task.rankInProgressId)) out.push(task)
        })
        return out.sort(byOrder)
    }

    static async findById(id: string | undefined | null): Promise<ITask | undefined> {
        await storeReady()
        if (!id) return undefined
        const m = getMaps().tasks.get(id)
        return m ? read(id, m) : undefined
    }

    static async getById(id: string): Promise<ITask> {
        const task = await Task.findById(id)
        if (!task) throw new Error(`task with id ${id} not found`)
        return task
    }

    static async getByRankInProgressId(id: string): Promise<ITask[]> {
        await storeReady()
        const out: ITask[] = []
        getMaps().tasks.forEach((m, taskId) => {
            if (readString(m, 'rankInProgressId') === id) out.push(read(taskId, m))
        })
        return out.sort(byOrder)
    }

    static async getRequirementStatus(id: string, rankId: number): Promise<{ isCompleted: boolean; requirement: IRequirement }[]> {
        const task = await Task.getById(id)
        return Requirement.findByRankId(rankId).map((requirement) => ({
            isCompleted: task.requirementIds.includes(requirement.id),
            requirement,
        }))
    }

    /** New task; `partIdea` starts as the whole idea (= nothing selected yet). */
    static async add(rankInProgressId: string | undefined): Promise<ITask> {
        if (rankInProgressId === undefined) throw new Error('rankInProgressId is undefined')
        await storeReady()
        const { ranksInProgress, tasks } = getMaps()
        const rip = ranksInProgress.get(rankInProgressId)
        if (!rip) throw new Error(`rankInProgress with id ${rankInProgressId} not found`)
        const rank = Rank.find(readNumber(rip, 'rankId', Rank.default().id))
        if (!rank) throw new Error(`rank with id ${readNumber(rip, 'rankId')} not found`)

        let order = 0
        tasks.forEach((t) => {
            if (readString(t, 'rankInProgressId') === rankInProgressId) order = Math.max(order, readNumber(t, 'order') + 1)
        })
        const task: ITask = {
            id: newId(),
            rankInProgressId,
            requirementIds: [],
            content: '',
            status: Status.CREATED,
            partIdea: rank.idea.split(' '),
            order,
            createdAt: Date.now(),
        }
        getDoc().transact(() => {
            const m = new Y.Map<unknown>()
            tasks.set(task.id, m)
            m.set('rankInProgressId', task.rankInProgressId)
            m.set('content', new Y.Text())
            m.set('status', task.status)
            m.set('requirementIds', new Y.Map<unknown>())
            m.set('partIdea', task.partIdea)
            m.set('order', task.order)
            m.set('createdAt', task.createdAt)
        }, LOCAL_ORIGIN)
        return task
    }

    /**
     * Compatibility API: writes only what differs from the document — content as a text diff,
     * requirements as set additions/removals — so concurrent edits from other devices survive.
     */
    static async update(task: ITask | undefined): Promise<ITask | undefined> {
        if (task === undefined) throw new Error('While trying to update task, passed undefined')
        await storeReady()
        const m = getMaps().tasks.get(task.id)
        if (!m) return undefined
        getDoc().transact(() => {
            if (task.status !== m.get('status')) m.set('status', task.status)
            applyStringToYText(ensureNestedText(m, 'content'), task.content, LOCAL_ORIGIN)
            const set = ensureNestedMap(m, 'requirementIds')
            const wanted = new Set(task.requirementIds.map(String))
            for (const key of [...set.keys()]) if (!wanted.has(key)) set.delete(key)
            for (const key of wanted) if (!set.has(key)) set.set(key, true)
            if (JSON.stringify(readStringArray(m, 'partIdea')) !== JSON.stringify(task.partIdea)) m.set('partIdea', [...task.partIdea])
            if (task.order !== m.get('order')) m.set('order', task.order)
        }, LOCAL_ORIGIN)
        return task
    }

    static async setStatus(id: string, status: Status): Promise<void> {
        await storeReady()
        const m = taskMap(id)
        if (m.get('status') !== status) getDoc().transact(() => m.set('status', status), LOCAL_ORIGIN)
    }

    static async setContent(id: string, content: string): Promise<void> {
        await storeReady()
        const m = taskMap(id)
        getDoc().transact(() => applyStringToYText(ensureNestedText(m, 'content'), content, LOCAL_ORIGIN), LOCAL_ORIGIN)
    }

    /** Adds/removes a requirement; with `selected` omitted it toggles. */
    static async toggleRequirement(id: string, requirementId: number, selected?: boolean): Promise<boolean> {
        await storeReady()
        const m = taskMap(id)
        const key = String(requirementId)
        let result = false
        getDoc().transact(() => {
            const set = ensureNestedMap(m, 'requirementIds')
            result = selected ?? !set.has(key)
            if (result) set.set(key, true)
            else set.delete(key)
        }, LOCAL_ORIGIN)
        return result
    }

    /** Stored atomically (last writer wins). */
    static async setPartIdea(id: string, partIdea: string[]): Promise<void> {
        await storeReady()
        const m = taskMap(id)
        getDoc().transact(() => m.set('partIdea', [...partIdea]), LOCAL_ORIGIN)
    }

    /**
     * Shared text of the task, for collaborative editing (CollaborativeTextarea).
     * Only valid after storeReady().
     */
    static contentText(id: string): Y.Text | undefined {
        const m = getMaps().tasks.get(id)
        if (!m) return undefined
        const current = m.get('content')
        if (current instanceof Y.Text) return current
        let created: Y.Text | undefined
        getDoc().transact(() => {
            created = ensureNestedText(m, 'content')
        }, LOCAL_ORIGIN)
        return created
    }

    /** Deletes the task and its comments. */
    static async deleteObject(id: string | undefined): Promise<void> {
        if (id === undefined) throw new Error(`id ${id} not found`)
        await storeReady()
        if (!getMaps().tasks.has(id)) throw new Error(`task with id ${id} not found`)
        getDoc().transact(() => deleteTasksWhere((_t, taskId) => taskId === id), LOCAL_ORIGIN)
    }
}
