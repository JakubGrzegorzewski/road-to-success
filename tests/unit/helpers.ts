import * as Y from 'yjs'
import { __useInMemoryStore } from '@/scripts/store/persistence'
import { User } from '@/scripts/database/User'
import { RankInProgress } from '@/scripts/database/RankInProgress'

/** Fresh in-memory document for a test (no IndexedDB, no migration). */
export function freshDoc(doc: Y.Doc = new Y.Doc()): Y.Doc {
    return __useInMemoryStore(doc)
}

export async function seedAdvancement(rankId = 0) {
    const mentee = await User.add({ fullName: 'Jan Kowalski HO' })
    const mentor = await User.add({ fullName: 'hm. Anna Nowak' })
    const rip = await RankInProgress.add({ rankId, personId: mentee.id, mentorId: mentor.id })
    return { mentee, mentor, rip }
}

/** Plain JSON of the data maps, for comparing documents. */
export function snapshot(doc: Y.Doc) {
    return {
        people: doc.getMap('people').toJSON(),
        ranksInProgress: doc.getMap('ranksInProgress').toJSON(),
        tasks: doc.getMap('tasks').toJSON(),
        comments: doc.getMap('comments').toJSON(),
    }
}

/** Exchange all updates between two documents (both directions). */
export function syncDocs(a: Y.Doc, b: Y.Doc) {
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a, Y.encodeStateVector(b)))
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b, Y.encodeStateVector(a)))
}
