import Dexie from 'dexie'
import * as Y from 'yjs'
import { getMaps, MIGRATION_ORIGIN } from './doc'
import { newId } from './ids'
import { getLocal, isLocalStateDurable, setLocal } from './localState'
import { isStatus, Status } from '@/scripts/interfaces'

/** Name of the database used by versions < 2.0 (Dexie, numeric `++id` keys). */
export const LEGACY_DB_NAME = 'RoadSuccessDB'

// Shapes stored by the old Dexie schema (everything optional: read defensively).
export interface LegacyUser { id?: number; fullName?: string }
export interface LegacyRankInProgress { id?: number; rankId?: number; userId?: number; mentorId?: number; taskIds?: number[] }
export interface LegacyTask {
    id?: number;
    rankInProgressId?: number;
    requirementsIds?: number[];
    content?: string;
    status?: string;
    partIdea?: string[];
    commentIds?: number[];
}
export interface LegacyComment { id?: number; date?: string; content?: string; taskId?: number; userId?: number }

export interface LegacySnapshot {
    users: LegacyUser[];
    ranksInProgress: LegacyRankInProgress[];
    tasks: LegacyTask[];
    taskComments: LegacyComment[];
}

export interface MigrationResult {
    people: number;
    ranksInProgress: number;
    tasks: number;
    comments: number;
    skipped: number;
}

export function hasLegacyData(s: LegacySnapshot | null): s is LegacySnapshot {
    return !!s && (s.users.length > 0 || s.ranksInProgress.length > 0 || s.tasks.length > 0 || s.taskComments.length > 0)
}

/** Reads the old Dexie database without declaring a schema (Dexie dynamic mode). Never creates it. */
export async function readLegacySnapshot(name = LEGACY_DB_NAME): Promise<LegacySnapshot | null> {
    if (typeof indexedDB === 'undefined') return null
    if (!(await Dexie.exists(name))) return null
    const db = new Dexie(name)
    try {
        await db.open()
        const tables = new Set(db.tables.map((t) => t.name))
        const read = async <T>(table: string): Promise<T[]> => (tables.has(table) ? ((await db.table(table).toArray()) as T[]) : [])
        return {
            users: await read<LegacyUser>('users'),
            ranksInProgress: await read<LegacyRankInProgress>('ranksInProgress'),
            tasks: await read<LegacyTask>('tasks'),
            taskComments: await read<LegacyComment>('taskComments'),
        }
    } finally {
        db.close()
    }
}

const byLegacyId = <T extends { id?: number }>(a: T, b: T) => (a.id ?? 0) - (b.id ?? 0)

function hasAnyLegacyImport(doc: Y.Doc): boolean {
    for (const key of getMaps(doc).meta.keys()) if (key.startsWith('legacyImport:')) return true
    return false
}

/**
 * Writes a legacy snapshot into the Yjs document in ONE transaction:
 * numeric ids → UUIDs, foreign keys rewritten, reverse arrays (taskIds, commentIds, …) dropped,
 * `requirementsIds` → set, task content → Y.Text. Records pointing at missing parents are skipped.
 */
export function migrateLegacySnapshot(doc: Y.Doc, snapshot: LegacySnapshot, migrationId: string, now = Date.now()): MigrationResult {
    const maps = getMaps(doc)
    const result: MigrationResult = { people: 0, ranksInProgress: 0, tasks: 0, comments: 0, skipped: 0 }

    const personIds = new Map<number, string>()
    const rankInProgressIds = new Map<number, string>()
    const taskIds = new Map<number, string>()

    doc.transact(() => {
        for (const u of [...snapshot.users].sort(byLegacyId)) {
            if (typeof u.id !== 'number') {
                result.skipped++
                continue
            }
            const id = newId()
            personIds.set(u.id, id)
            const m = new Y.Map<unknown>()
            maps.people.set(id, m)
            m.set('fullName', typeof u.fullName === 'string' ? u.fullName : '')
            result.people++
        }

        const rips = [...snapshot.ranksInProgress].sort(byLegacyId)
        const maxRipId = Math.max(0, ...rips.map((r) => r.id ?? 0))
        for (const r of rips) {
            if (typeof r.id !== 'number') {
                result.skipped++
                continue
            }
            const id = newId()
            rankInProgressIds.set(r.id, id)
            const m = new Y.Map<unknown>()
            maps.ranksInProgress.set(id, m)
            m.set('rankId', typeof r.rankId === 'number' ? r.rankId : 0)
            m.set('personId', personIds.get(r.userId ?? -1) ?? '')
            m.set('mentorId', personIds.get(r.mentorId ?? -1) ?? '')
            // keep the old creation order (Dexie listed records by ascending id)
            m.set('createdAt', now - (maxRipId - r.id))
            result.ranksInProgress++
        }

        for (const t of [...snapshot.tasks].sort(byLegacyId)) {
            const ripId = rankInProgressIds.get(t.rankInProgressId ?? -1)
            if (typeof t.id !== 'number' || !ripId) {
                result.skipped++
                continue
            }
            const id = newId()
            taskIds.set(t.id, id)
            const m = new Y.Map<unknown>()
            maps.tasks.set(id, m)
            m.set('rankInProgressId', ripId)
            m.set('content', new Y.Text(typeof t.content === 'string' ? t.content : ''))
            m.set('status', isStatus(t.status) ? t.status : Status.CREATED)
            const requirementIds = new Y.Map<unknown>()
            m.set('requirementIds', requirementIds)
            for (const reqId of Array.isArray(t.requirementsIds) ? t.requirementsIds : []) {
                if (typeof reqId === 'number' && Number.isFinite(reqId)) requirementIds.set(String(reqId), true)
            }
            m.set('partIdea', Array.isArray(t.partIdea) ? t.partIdea.filter((p) => typeof p === 'string') : [])
            m.set('order', t.id)
            m.set('createdAt', now)
            result.tasks++
        }

        for (const c of [...snapshot.taskComments].sort(byLegacyId)) {
            const taskId = taskIds.get(c.taskId ?? -1)
            if (!taskId) {
                result.skipped++
                continue
            }
            const m = new Y.Map<unknown>()
            maps.comments.set(newId(), m)
            m.set('taskId', taskId)
            m.set('authorId', personIds.get(c.userId ?? -1) ?? '')
            m.set('date', typeof c.date === 'string' ? c.date : new Date(now).toISOString())
            m.set('content', typeof c.content === 'string' ? c.content : '')
            result.comments++
        }

        maps.meta.set(`legacyImport:${migrationId}`, now)
    }, MIGRATION_ORIGIN)

    return result
}

/**
 * One-time migration on this device. The marker lives in the per-device store (not in the
 * synced document), so every device that still has old data migrates its own copy.
 * The old Dexie database is left untouched as a backup.
 */
export async function migrateFromDexie(doc: Y.Doc, readSnapshot: () => Promise<LegacySnapshot | null> = readLegacySnapshot): Promise<MigrationResult | null> {
    const state = await getLocal('dexieMigration')
    if (state && state.status !== 'started') return null
    // Without a durable per-device marker a migration could repeat on every start and
    // duplicate records; in that (rare) case trust any marker already in the document.
    if (!state && !(await isLocalStateDurable()) && hasAnyLegacyImport(doc)) return null

    const migrationId = state?.id ?? newId()
    // A previous run may have written the data but not the "done" marker.
    if (state?.status === 'started' && getMaps(doc).meta.has(`legacyImport:${migrationId}`)) {
        await setLocal('dexieMigration', { id: migrationId, status: 'done', at: Date.now() })
        return null
    }

    const snapshot = await readSnapshot()
    if (!hasLegacyData(snapshot)) {
        await setLocal('dexieMigration', { id: migrationId, status: 'nothing-to-migrate', at: Date.now() })
        return null
    }

    await setLocal('dexieMigration', { id: migrationId, status: 'started', at: Date.now() })
    const result = migrateLegacySnapshot(doc, snapshot, migrationId)
    await setLocal('dexieMigration', { id: migrationId, status: 'done', at: Date.now() })
    console.info('[store] migrated data from the previous version', result)
    return result
}
