import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { User } from '@/scripts/database/User'
import { Task } from '@/scripts/database/Task'
import { getMaps, SCHEMA_VERSION } from '@/scripts/store/doc'
import {
    buildJsonExport,
    decodeRtsFile,
    encodeRtsFile,
    exportFileName,
    importRtsFile,
    previewImport,
    RtsFileError,
} from '@/scripts/export/exportFile'
import { freshDoc, seedAdvancement, snapshot } from './helpers'

const toBytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer())

describe('.rts export/import', () => {
    it('round-trips the document with a readable header', async () => {
        const a = freshDoc()
        const { rip } = await seedAdvancement(0)
        const t = await Task.add(rip.id)
        await Task.setContent(t.id, 'Zbiórka')
        const bytes = encodeRtsFile(a, new Date('2026-10-18T10:00:00Z'))
        const { header, update } = decodeRtsFile(bytes)
        expect(header).toMatchObject({ app: 'road-to-success', schemaVersion: SCHEMA_VERSION, exportedAt: '2026-10-18T10:00:00.000Z' })
        expect(header.counts).toEqual({ people: 2, ranksInProgress: 1, tasks: 1, comments: 0 })

        const b = new Y.Doc()
        Y.applyUpdate(b, update)
        expect(snapshot(b)).toEqual(snapshot(a))
    })

    it('merges a file from another device instead of overwriting', async () => {
        const phone = freshDoc()
        await User.add({ fullName: 'Z telefonu' })
        const fromPhone = encodeRtsFile(phone)

        const laptop = freshDoc()
        await User.add({ fullName: 'Z laptopa' })
        const { preview } = await previewImport(fromPhone)
        expect(preview.before.people).toBe(1)
        expect(preview.incoming.people).toBe(1)
        expect(preview.after.people).toBe(2)
        expect(getMaps(laptop).people.size).toBe(1) // preview does not change anything

        await importRtsFile(fromPhone)
        await importRtsFile(fromPhone) // idempotent
        expect((await User.getAll()).map((u) => u.fullName)).toEqual(['Z laptopa', 'Z telefonu'])
    })

    it('rejects foreign, damaged and newer files', async () => {
        freshDoc()
        const err = (fn: () => unknown) => {
            try {
                fn()
            } catch (e) {
                return e as RtsFileError
            }
            throw new Error('expected an error')
        }
        expect(err(() => decodeRtsFile(new TextEncoder().encode('{"hello":1}'))).code).toBe('not-rts')

        const ok = encodeRtsFile(freshDoc())
        const wrongFormat = ok.slice()
        wrongFormat[6] = 9
        expect(err(() => decodeRtsFile(wrongFormat)).code).toBe('unsupported-format')
        expect(err(() => decodeRtsFile(ok.slice(0, 12))).code).toBe('corrupt')

        // header claiming a newer schema
        const header = new TextEncoder().encode(JSON.stringify({ app: 'road-to-success', schemaVersion: SCHEMA_VERSION + 1 }))
        const newer = new Uint8Array(11 + header.length)
        newer.set(ok.subarray(0, 7))
        new DataView(newer.buffer).setUint32(7, header.length, true)
        newer.set(header, 11)
        const e = err(() => decodeRtsFile(newer))
        expect(e.code).toBe('newer-schema')
        expect(e.details.schemaVersion).toBe(SCHEMA_VERSION + 1)

        // damaged Yjs payload
        const broken = new Uint8Array([...ok.subarray(0, ok.length - 3), 255, 255, 255, 255, 1])
        await expect(previewImport(broken)).rejects.toThrow()
    })

    it('exports readable JSON and dated file names', async () => {
        freshDoc()
        const { rip, mentee } = await seedAdvancement(0)
        const t = await Task.add(rip.id)
        await Task.toggleRequirement(t.id, 1001)
        const json = buildJsonExport(undefined, new Date('2026-01-02T00:00:00Z'))
        expect(json.people.map((p) => p.fullName)).toContain(mentee.fullName)
        expect(json.advancements).toMatchObject([{ rank: 'Przewodnik', mentee: mentee.fullName, tasks: [{ requirementIds: [1001] }] }])
        expect(exportFileName('rts', new Date(2026, 0, 2))).toBe('road-to-success-2026-01-02.rts')
        expect(await toBytes(new Blob(['x']))).toEqual(new Uint8Array([120]))
    })
})
