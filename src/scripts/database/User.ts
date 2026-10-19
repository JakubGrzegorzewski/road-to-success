import * as Y from 'yjs'
import type { IUser } from '../interfaces'
import { getDoc, getMaps, LOCAL_ORIGIN, readString, type RecordMap } from '../store/doc'
import { newId } from '../store/ids'
import { storeReady } from '../store/persistence'

const collator = new Intl.Collator('pl', { sensitivity: 'base' })

function read(id: string, m: RecordMap): IUser {
    return { id, fullName: readString(m, 'fullName') }
}

/** People (mentees and mentors) — `people` map of the Yjs document. */
export class User {
    static async getAll(): Promise<IUser[]> {
        await storeReady()
        const out: IUser[] = []
        getMaps().people.forEach((m, id) => out.push(read(id, m)))
        return out.sort((a, b) => collator.compare(a.fullName, b.fullName))
    }

    static async findById(id: string | undefined | null): Promise<IUser | undefined> {
        await storeReady()
        if (!id) return undefined
        const m = getMaps().people.get(id)
        return m ? read(id, m) : undefined
    }

    static async getById(id: string): Promise<IUser> {
        const user = await User.findById(id)
        if (!user) throw new Error(`User with id ${id} not found`)
        return user
    }

    static async add(user: Omit<IUser, 'id'> & { id?: string }): Promise<IUser> {
        await storeReady()
        const id = user.id ?? newId()
        const fullName = user.fullName.trim()
        getDoc().transact(() => {
            const m = new Y.Map<unknown>()
            getMaps().people.set(id, m)
            m.set('fullName', fullName)
        }, LOCAL_ORIGIN)
        return { id, fullName }
    }

    static async update(user: IUser): Promise<IUser | undefined> {
        await storeReady()
        const m = getMaps().people.get(user.id)
        if (!m) return undefined
        const fullName = user.fullName.trim()
        if (readString(m, 'fullName') !== fullName) getDoc().transact(() => m.set('fullName', fullName), LOCAL_ORIGIN)
        return { id: user.id, fullName }
    }

    /** Advancements keep a dangling reference (shown as "—"); nothing else is deleted. */
    static async deleteObject(id: string): Promise<void> {
        await storeReady()
        getDoc().transact(() => getMaps().people.delete(id), LOCAL_ORIGIN)
    }
}
