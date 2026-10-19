import * as Y from 'yjs'
import type { ITaskComment } from '../interfaces'
import { getDoc, getMaps, LOCAL_ORIGIN, readString, type RecordMap } from '../store/doc'
import { newId } from '../store/ids'
import { storeReady } from '../store/persistence'

function read(id: string, m: RecordMap): ITaskComment {
    return {
        id,
        taskId: readString(m, 'taskId'),
        authorId: readString(m, 'authorId'),
        date: readString(m, 'date'),
        content: readString(m, 'content'),
    }
}

/** Comments on tasks — `comments` map of the Yjs document. */
export class TaskComment {
    /** Comments whose task (and that task's advancement) still exist. */
    static async getAll(): Promise<ITaskComment[]> {
        await storeReady()
        const { comments, tasks, ranksInProgress } = getMaps()
        const out: ITaskComment[] = []
        comments.forEach((m, id) => {
            const c = read(id, m)
            const task = tasks.get(c.taskId)
            if (task && ranksInProgress.has(readString(task, 'rankInProgressId'))) out.push(c)
        })
        return out.sort((a, b) => a.date.localeCompare(b.date))
    }

    static async getById(id: string): Promise<ITaskComment> {
        await storeReady()
        const m = getMaps().comments.get(id)
        if (!m) throw new Error(`taskComment with id ${id} not found`)
        return read(id, m)
    }

    static async getByTaskId(taskId: string): Promise<ITaskComment[]> {
        await storeReady()
        const out: ITaskComment[] = []
        getMaps().comments.forEach((m, id) => {
            if (readString(m, 'taskId') === taskId) out.push(read(id, m))
        })
        return out.sort((a, b) => a.date.localeCompare(b.date))
    }

    static async add(comment: Omit<ITaskComment, 'id' | 'date'> & { id?: string; date?: string }): Promise<ITaskComment> {
        await storeReady()
        const record: ITaskComment = {
            id: comment.id ?? newId(),
            taskId: comment.taskId,
            authorId: comment.authorId,
            date: comment.date ?? new Date().toISOString(),
            content: comment.content,
        }
        getDoc().transact(() => {
            const m = new Y.Map<unknown>()
            getMaps().comments.set(record.id, m)
            m.set('taskId', record.taskId)
            m.set('authorId', record.authorId)
            m.set('date', record.date)
            m.set('content', record.content)
        }, LOCAL_ORIGIN)
        return record
    }

    static async update(comment: ITaskComment): Promise<ITaskComment | undefined> {
        await storeReady()
        const m = getMaps().comments.get(comment.id)
        if (!m) return undefined
        getDoc().transact(() => {
            if (readString(m, 'content') !== comment.content) m.set('content', comment.content)
            if (readString(m, 'date') !== comment.date) m.set('date', comment.date)
        }, LOCAL_ORIGIN)
        return comment
    }

    static async deleteObject(id: string): Promise<void> {
        await storeReady()
        getDoc().transact(() => getMaps().comments.delete(id), LOCAL_ORIGIN)
    }
}
