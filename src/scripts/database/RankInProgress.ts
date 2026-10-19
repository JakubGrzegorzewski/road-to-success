import * as Y from 'yjs'
import type { IRankInProgress, IRequirement } from '../interfaces'
import { getDoc, getMaps, LOCAL_ORIGIN, readNumber, readString, type RecordMap } from '../store/doc'
import { newId } from '../store/ids'
import { storeReady } from '../store/persistence'
import { Rank } from './Rank'
import { Requirement } from './Requirement'
import { deleteTasksWhere, readTaskRequirementIds } from './Task'
import { User } from './User'

function read(id: string, m: RecordMap): IRankInProgress {
    return {
        id,
        rankId: readNumber(m, 'rankId', Rank.default().id),
        personId: readString(m, 'personId'),
        mentorId: readString(m, 'mentorId'),
        createdAt: readNumber(m, 'createdAt'),
    }
}

/** Advancements ("próby") — `ranksInProgress` map of the Yjs document. */
export class RankInProgress {
    static async getAll(): Promise<IRankInProgress[]> {
        await storeReady()
        const out: IRankInProgress[] = []
        getMaps().ranksInProgress.forEach((m, id) => out.push(read(id, m)))
        return out.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    }

    static async findById(id: string | undefined | null): Promise<IRankInProgress | undefined> {
        await storeReady()
        if (!id) return undefined
        const m = getMaps().ranksInProgress.get(id)
        return m ? read(id, m) : undefined
    }

    static async getById(id: string): Promise<IRankInProgress> {
        const rip = await RankInProgress.findById(id)
        if (!rip) throw new Error(`rankInProgress with id ${id} not found`)
        return rip
    }

    /** Every requirement of the advancement's rank, with whether at least one task covers it. */
    static async getRequirementsStatuses(id: string): Promise<{ isCompleted: boolean; requirement: IRequirement }[]> {
        const rip = await RankInProgress.getById(id)
        const covered = new Set<number>()
        getMaps().tasks.forEach((t) => {
            if (readString(t, 'rankInProgressId') === id) readTaskRequirementIds(t).forEach((r) => covered.add(r))
        })
        return Requirement.findByRankId(rip.rankId).map((requirement) => ({ isCompleted: covered.has(requirement.id), requirement }))
    }

    static async add(data: Omit<IRankInProgress, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<IRankInProgress> {
        await storeReady()
        const record: IRankInProgress = {
            id: data.id ?? newId(),
            rankId: data.rankId,
            personId: data.personId,
            mentorId: data.mentorId,
            createdAt: data.createdAt ?? Date.now(),
        }
        getDoc().transact(() => {
            const m = new Y.Map<unknown>()
            getMaps().ranksInProgress.set(record.id, m)
            m.set('rankId', record.rankId)
            m.set('personId', record.personId)
            m.set('mentorId', record.mentorId)
            m.set('createdAt', record.createdAt)
        }, LOCAL_ORIGIN)
        return record
    }

    /** New advancement with the first rank and the first person as mentee and mentor. */
    static async addDefault(): Promise<IRankInProgress> {
        const users = await User.getAll()
        const first = users[0]
        if (!first) throw new Error('No users')
        return RankInProgress.add({ rankId: Rank.default().id, personId: first.id, mentorId: first.id })
    }

    /**
     * Writes only the fields that differ from the document. Changing the rank removes the
     * advancement's tasks (they belong to the old rank's idea/requirements) in the same transaction.
     */
    static async update(rankInProgress: IRankInProgress | undefined): Promise<IRankInProgress | undefined> {
        if (!rankInProgress) throw new Error('ranksInProgress is undefined')
        await storeReady()
        const m = getMaps().ranksInProgress.get(rankInProgress.id)
        if (!m) return undefined
        const current = read(rankInProgress.id, m)
        getDoc().transact(() => {
            if (current.rankId !== rankInProgress.rankId) {
                deleteTasksWhere((t) => readString(t, 'rankInProgressId') === rankInProgress.id)
                m.set('rankId', rankInProgress.rankId)
            }
            if (current.personId !== rankInProgress.personId) m.set('personId', rankInProgress.personId)
            if (current.mentorId !== rankInProgress.mentorId) m.set('mentorId', rankInProgress.mentorId)
        }, LOCAL_ORIGIN)
        return rankInProgress
    }

    /** Deletes the advancement with its tasks and their comments in one transaction. */
    static async deleteObject(id: string): Promise<void> {
        await storeReady()
        getDoc().transact(() => {
            deleteTasksWhere((t) => readString(t, 'rankInProgressId') === id)
            getMaps().ranksInProgress.delete(id)
        }, LOCAL_ORIGIN)
    }
}
