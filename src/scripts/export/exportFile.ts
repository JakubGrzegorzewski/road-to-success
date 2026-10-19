import * as Y from 'yjs'
import { countRecords, docSchemaVersion, getDoc, getMaps, IMPORT_ORIGIN, readNumber, readString, SCHEMA_VERSION, type RecordCounts } from '@/scripts/store/doc'
import { storeReady } from '@/scripts/store/persistence'
import { readTaskRequirementIds } from '@/scripts/database/Task'
import { Rank } from '@/scripts/database/Rank'
import { Requirement } from '@/scripts/database/Requirement'
import { isCommentVisible, readComment } from '@/scripts/database/Comment'
import type { IComment } from '@/scripts/interfaces'

/**
 * `.rts` backup file:
 *   bytes 0..5   magic "RTSDOC"
 *   byte  6      container format version (1)
 *   bytes 7..10  header length (uint32, little endian)
 *   header       UTF-8 JSON {@link RtsHeader}
 *   rest         Yjs update = Y.encodeStateAsUpdate(doc)
 *
 * Importing is Y.applyUpdate, which merges: it is commutative and idempotent, so importing the
 * same file twice is harmless and importing a file from another device IS a synchronisation.
 */
export const RTS_MAGIC = new Uint8Array([0x52, 0x54, 0x53, 0x44, 0x4f, 0x43]) // "RTSDOC"
export const RTS_FORMAT_VERSION = 1
export const RTS_EXTENSION = 'rts'
export const RTS_MIME = 'application/octet-stream'

export interface RtsHeader {
    app: 'road-to-success';
    schemaVersion: number;
    appVersion: string;
    exportedAt: string;
    counts: RecordCounts;
}

export type RtsErrorCode = 'not-rts' | 'unsupported-format' | 'newer-schema' | 'corrupt'

export class RtsFileError extends Error {
    constructor(
        readonly code: RtsErrorCode,
        message: string,
        readonly details: { schemaVersion?: number } = {},
    ) {
        super(message)
        this.name = 'RtsFileError'
    }
}

const appVersion = () => (typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev')

export function encodeRtsFile(doc: Y.Doc, now = new Date()): Uint8Array {
    const update = Y.encodeStateAsUpdate(doc)
    const header: RtsHeader = {
        app: 'road-to-success',
        schemaVersion: docSchemaVersion(doc),
        appVersion: appVersion(),
        exportedAt: now.toISOString(),
        counts: countRecords(doc),
    }
    const headerBytes = new TextEncoder().encode(JSON.stringify(header))
    const out = new Uint8Array(RTS_MAGIC.length + 1 + 4 + headerBytes.length + update.length)
    out.set(RTS_MAGIC, 0)
    out[RTS_MAGIC.length] = RTS_FORMAT_VERSION
    new DataView(out.buffer).setUint32(RTS_MAGIC.length + 1, headerBytes.length, true)
    out.set(headerBytes, RTS_MAGIC.length + 5)
    out.set(update, RTS_MAGIC.length + 5 + headerBytes.length)
    return out
}

export function decodeRtsFile(bytes: Uint8Array): { header: RtsHeader; update: Uint8Array } {
    if (bytes.length < RTS_MAGIC.length + 5 || !RTS_MAGIC.every((b, i) => bytes[i] === b)) {
        throw new RtsFileError('not-rts', 'This is not a Road To Success backup file')
    }
    if (bytes[RTS_MAGIC.length] !== RTS_FORMAT_VERSION) {
        throw new RtsFileError('unsupported-format', `Unsupported file format version ${bytes[RTS_MAGIC.length]}`)
    }
    const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(RTS_MAGIC.length + 1, true)
    const headerStart = RTS_MAGIC.length + 5
    if (headerStart + headerLength > bytes.length) throw new RtsFileError('corrupt', 'Truncated file header')
    let header: RtsHeader
    try {
        header = JSON.parse(new TextDecoder().decode(bytes.subarray(headerStart, headerStart + headerLength))) as RtsHeader
    } catch {
        throw new RtsFileError('corrupt', 'Unreadable file header')
    }
    if (header?.app !== 'road-to-success' || typeof header.schemaVersion !== 'number') {
        throw new RtsFileError('corrupt', 'Invalid file header')
    }
    if (header.schemaVersion > SCHEMA_VERSION) {
        throw new RtsFileError('newer-schema', 'The file was created by a newer version of the app', { schemaVersion: header.schemaVersion })
    }
    return { header, update: bytes.slice(headerStart + headerLength) }
}

export interface ImportPreview {
    header: RtsHeader;
    /** Records in the file. */
    incoming: RecordCounts;
    /** Records on this device after merging. */
    after: RecordCounts;
    /** Records on this device before merging. */
    before: RecordCounts;
}

/**
 * Validates the file and computes what a merge would produce, on a scratch copy of the
 * document (nothing is changed yet).
 */
export async function previewImport(bytes: Uint8Array): Promise<{ preview: ImportPreview; update: Uint8Array }> {
    await storeReady()
    const { header, update } = decodeRtsFile(bytes)
    const incomingDoc = new Y.Doc()
    try {
        Y.applyUpdate(incomingDoc, update)
    } catch {
        throw new RtsFileError('corrupt', 'The file content is damaged')
    }
    if (docSchemaVersion(incomingDoc) > SCHEMA_VERSION) {
        throw new RtsFileError('newer-schema', 'The file was created by a newer version of the app', { schemaVersion: docSchemaVersion(incomingDoc) })
    }
    const merged = new Y.Doc()
    Y.applyUpdate(merged, Y.encodeStateAsUpdate(getDoc()))
    Y.applyUpdate(merged, update)
    return {
        update,
        preview: { header, incoming: countRecords(incomingDoc), before: countRecords(getDoc()), after: countRecords(merged) },
    }
}

/** Merges a validated update into the local document. */
export async function applyImport(update: Uint8Array): Promise<void> {
    await storeReady()
    Y.applyUpdate(getDoc(), update, IMPORT_ORIGIN)
}

export async function importRtsFile(bytes: Uint8Array): Promise<ImportPreview> {
    const { preview, update } = await previewImport(bytes)
    await applyImport(update)
    return preview
}

export async function exportRtsFile(now = new Date()): Promise<Blob> {
    await storeReady()
    const bytes = encodeRtsFile(getDoc(), now)
    return new Blob([bytes as BlobPart], { type: RTS_MIME })
}

/** Human-readable snapshot (not importable – use .rts for backups). */
export function buildJsonExport(doc: Y.Doc = getDoc(), now = new Date()) {
    const m = getMaps(doc)
    const people: { id: string; fullName: string }[] = []
    m.people.forEach((p, id) => people.push({ id, fullName: readString(p, 'fullName') }))
    const name = (id: string) => people.find((p) => p.id === id)?.fullName ?? null
    const allComments: IComment[] = []
    m.comments.forEach((c, commentId) => {
        const comment = readComment(commentId, c, m)
        if (isCommentVisible(comment, m)) allComments.push(comment)
    })
    allComments.sort((a, b) => a.date.localeCompare(b.date))
    const exportComment = (c: IComment) => ({
        id: c.id,
        author: name(c.authorId) ?? (c.authorName || null),
        date: c.date,
        content: c.content,
        resolved: c.resolved,
        ...(c.editedAt ? { editedAt: c.editedAt } : {}),
        ...(c.resolved && c.resolvedAt ? { resolvedAt: c.resolvedAt, resolvedBy: c.resolvedById ? name(c.resolvedById) : null } : {}),
    })
    const advancements: object[] = []
    m.ranksInProgress.forEach((r, id) => {
        const rankId = readNumber(r, 'rankId')
        const ripComments = allComments.filter((c) => c.rankInProgressId === id)
        const tasks: object[] = []
        m.tasks.forEach((t, taskId) => {
            if (readString(t, 'rankInProgressId') !== id) return
            const comments = ripComments.filter((c) => c.targetType === 'task' && c.targetId === taskId).map(exportComment)
            tasks.push({
                id: taskId,
                order: readNumber(t, 'order'),
                status: readString(t, 'status'),
                content: readString(t, 'content'),
                requirementIds: readTaskRequirementIds(t),
                partIdea: t.get('partIdea') ?? [],
                comments,
            })
        })
        tasks.sort((a, b) => (a as { order: number }).order - (b as { order: number }).order)
        const requirements = Requirement.findByRankId(rankId)
            .map((req) => ({
                id: req.id,
                number: req.number,
                comments: ripComments.filter((c) => c.targetType === 'requirement' && c.targetId === String(req.id)).map(exportComment),
            }))
            .filter((req) => req.comments.length > 0)
        advancements.push({
            id,
            rankId,
            rank: Rank.find(rankId)?.fullName ?? null,
            mentee: name(readString(r, 'personId')),
            mentor: name(readString(r, 'mentorId')),
            createdAt: new Date(readNumber(r, 'createdAt')).toISOString(),
            comments: ripComments.filter((c) => c.targetType === 'advancement').map(exportComment),
            requirements,
            tasks,
        })
    })
    return {
        format: 'road-to-success/json',
        schemaVersion: docSchemaVersion(doc),
        appVersion: appVersion(),
        exportedAt: now.toISOString(),
        people,
        advancements,
    }
}

export async function exportJsonFile(now = new Date()): Promise<Blob> {
    await storeReady()
    return new Blob([JSON.stringify(buildJsonExport(getDoc(), now), null, 2)], { type: 'application/json' })
}

export function exportFileName(extension: string, now = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `road-to-success-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.${extension}`
}
