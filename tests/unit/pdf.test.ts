import { describe, expect, it } from 'vitest'
import { buildDocDefinition, pdfFileName, type PdfLabels } from '@/scripts/pdf/buildAdvancementPdf'
import { buildAdvancementViewModel } from '@/scripts/pdf/advancementViewModel'
import { Requirement } from '@/scripts/database/Requirement'
import { Rank } from '@/scripts/database/Rank'
import { Status, type ITask } from '@/scripts/interfaces'

const labels: PdfLabels = {
    title: 'Próba',
    idea: 'Idea stopnia',
    mentee: 'Podopieczny',
    mentor: 'Opiekun',
    requirements: 'Wymagania',
    requirement: 'Wymaganie',
    tasks: 'Zadania',
    task: 'Zadanie',
    status: 'Status',
    ideaFragment: 'Idea stopnia realizowana zadaniem',
    none: '—',
    generatedOn: 'Wygenerowano',
    statuses: {
        [Status.DRAFT]: 'Szkic',
        [Status.CREATED]: 'Stworzone',
        [Status.PENDING]: 'Wysłane',
        [Status.IN_PROGRESS]: 'W trakcie',
        [Status.COMPLETED]: 'Zakończone',
        [Status.FAILED]: 'Nieudane',
    },
}

function vm() {
    const rank = Rank.find(0)!
    const task: ITask = {
        id: 't1',
        rankInProgressId: 'r',
        requirementIds: [1001],
        content: 'Zbiórka o Prawie Harcerskim',
        status: Status.IN_PROGRESS,
        partIdea: ['Jest wzorem dla harcerzy.'],
        order: 0,
        createdAt: 0,
    }
    return buildAdvancementViewModel({
        rankInProgress: { id: 'r', rankId: 0, personId: 'p', mentorId: 'm', createdAt: 0 },
        tasks: [task],
        requirements: Requirement.list(),
        rank,
        person: { id: 'p', fullName: 'Łukasz Żółć' },
        mentor: { id: 'm', fullName: 'hm. Anna' },
        now: new Date('2026-10-18T12:00:00Z'),
    })
}

describe('PDF document definition', () => {
    it('builds the requirement matrix with the rank artwork', () => {
        const def = buildDocDefinition(vm(), { layout: 'table', labels, background: true }, { icon: 'data:image/png;base64,AA==', background: 'data:image/png;base64,BB==' })
        const json = JSON.stringify(def)
        expect(json).toContain('Przewodnik')
        expect(json).toContain('Łukasz Żółć')
        expect(def.background).toBeInstanceOf(Function)
        expect(def.pageMargins).toEqual([48, 56, 72, 108])
        const content = def.content as Array<Record<string, unknown>>
        const section = content.find((c) => c.pageBreak === 'before') as { stack: Array<{ table?: { body: unknown[] } }> }
        expect(section.stack[1]!.table!.body).toHaveLength(Requirement.findByRankId(0).length + 1)
        // highlighted idea fragment
        expect(json).toContain('"decoration":"underline"')
    })

    it('builds the task list without background when not requested', () => {
        const def = buildDocDefinition(vm(), { layout: 'simple', labels, background: false }, { background: 'data:,x' })
        expect(def.background).toBeUndefined()
        expect(def.pageMargins).toEqual([48, 56, 48, 56])
        const json = JSON.stringify(def)
        expect(json).toContain('Zadanie 1')
        expect(json).toContain('W trakcie')
        expect(json).toContain('Jest wzorem dla harcerzy.')
    })

    it('makes ASCII file names', () => {
        expect(pdfFileName(vm())).toBe('przewodnik-lukasz-zolc.pdf')
    })
})
