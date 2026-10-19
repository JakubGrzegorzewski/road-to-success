import * as Y from 'yjs'

/**
 * The single Yjs document holding all user data.
 *
 * meta:            Map { schemaVersion, createdAt }
 * people:          Map<uuid, Map { fullName }>
 * ranksInProgress: Map<uuid, Map { rankId, personId, mentorId, createdAt }>
 * tasks:           Map<uuid, Map { rankInProgressId, content: Y.Text, status,
 *                                  requirementIds: Map<string, true>, partIdea: string[], order, createdAt }>
 * comments:        Map<uuid, Map { rankInProgressId, targetType: 'task' | 'requirement' | 'advancement', targetId,
 *                                     taskId (task comments only), authorId, authorName, date, editedAt?,
 *                                     content, resolved?, resolvedAt?, resolvedById? }>
 *                  (records without targetType predate comment targets and are read as task comments;
 *                   the change is additive, so SCHEMA_VERSION stays 1)
 *
 * Ranks and requirements are static JSON bundled with the app and referenced by id.
 */
export const SCHEMA_VERSION = 1

/** Transaction origins, so observers can tell where a change came from. */
export const LOCAL_ORIGIN = 'local'
export const MIGRATION_ORIGIN = 'migration'
export const IMPORT_ORIGIN = 'import'

export type RecordMap = Y.Map<unknown>

export interface DocMaps {
    meta: Y.Map<unknown>;
    people: Y.Map<RecordMap>;
    ranksInProgress: Y.Map<RecordMap>;
    tasks: Y.Map<RecordMap>;
    comments: Y.Map<RecordMap>;
}

export const DATA_MAP_NAMES = ['people', 'ranksInProgress', 'tasks', 'comments'] as const
export type DataMapName = (typeof DATA_MAP_NAMES)[number]

let currentDoc = new Y.Doc()

export function getDoc(): Y.Doc {
    return currentDoc
}

/** Tests only: swap the application document. */
export function __setDoc(doc: Y.Doc): void {
    currentDoc = doc
}

export function getMaps(doc: Y.Doc = currentDoc): DocMaps {
    return {
        meta: doc.getMap<unknown>('meta'),
        people: doc.getMap<RecordMap>('people'),
        ranksInProgress: doc.getMap<RecordMap>('ranksInProgress'),
        tasks: doc.getMap<RecordMap>('tasks'),
        comments: doc.getMap<RecordMap>('comments'),
    }
}

export function ensureMeta(doc: Y.Doc = currentDoc): void {
    const { meta } = getMaps(doc)
    if (typeof meta.get('schemaVersion') === 'number' && typeof meta.get('createdAt') === 'number') return
    doc.transact(() => {
        if (typeof meta.get('schemaVersion') !== 'number') meta.set('schemaVersion', SCHEMA_VERSION)
        if (typeof meta.get('createdAt') !== 'number') meta.set('createdAt', Date.now())
    }, LOCAL_ORIGIN)
}

export function docSchemaVersion(doc: Y.Doc = currentDoc): number {
    const v = getMaps(doc).meta.get('schemaVersion')
    return typeof v === 'number' ? v : SCHEMA_VERSION
}

export interface RecordCounts {
    people: number;
    ranksInProgress: number;
    tasks: number;
    comments: number;
}

export function countRecords(doc: Y.Doc = currentDoc): RecordCounts {
    const m = getMaps(doc)
    return {
        people: m.people.size,
        ranksInProgress: m.ranksInProgress.size,
        tasks: m.tasks.size,
        comments: m.comments.size,
    }
}

export function isDocEmpty(doc: Y.Doc = currentDoc): boolean {
    const c = countRecords(doc)
    return c.people + c.ranksInProgress + c.tasks + c.comments === 0
}

// ---------- typed readers (data may come from other devices, so read defensively) ----------

export function readString(m: RecordMap, key: string, fallback = ''): string {
    const v = m.get(key)
    if (typeof v === 'string') return v
    if (v instanceof Y.Text) return v.toString()
    return fallback
}

export function readNumber(m: RecordMap, key: string, fallback = 0): number {
    const v = m.get(key)
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export function readStringArray(m: RecordMap, key: string): string[] {
    const v = m.get(key)
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/** Returns the nested Y.Map stored under `key`, creating it when missing (old/malformed data). */
export function ensureNestedMap(m: RecordMap, key: string): Y.Map<unknown> {
    const v = m.get(key)
    if (v instanceof Y.Map) return v as Y.Map<unknown>
    const created = new Y.Map<unknown>()
    m.set(key, created)
    return created
}

/** Returns the nested Y.Text stored under `key`, creating it (with the old string value) when missing. */
export function ensureNestedText(m: RecordMap, key: string): Y.Text {
    const v = m.get(key)
    if (v instanceof Y.Text) return v
    const created = new Y.Text(typeof v === 'string' ? v : '')
    m.set(key, created)
    return created
}
