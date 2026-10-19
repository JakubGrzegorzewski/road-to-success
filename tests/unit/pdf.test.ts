import { describe, expect, it } from 'vitest'
import { buildDocDefinition, pdfFileName, type PdfLabels } from '@/scripts/pdf/buildAdvancementPdf'
import { buildAdvancementViewModel } from '@/scripts/pdf/advancementViewModel'
import { Requirement } from '@/scripts/database/Requirement'
import { Rank } from '@/scripts/database/Rank'
import { Status, type IComment, type ITask } from '@/scripts/interfaces'

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

describe('comments in the report', () => {
    const rank = Rank.find(0)!
    const task: ITask = {
        id: 't1',
        rankInProgressId: 'r',
        requirementIds: [1001],
        content: 'Zbiórka',
        status: Status.CREATED,
        partIdea: rank.idea.split(' '),
        order: 0,
        createdAt: 0,
    }
    const comment = (id: string, extra: Partial<IComment>): IComment => ({
        id,
        rankInProgressId: 'r',
        targetType: 'advancement',
        targetId: '',
        authorId: 'm',
        authorName: 'stara nazwa',
        date: '2026-10-01T10:00:00.000Z',
        content: id,
        resolved: false,
        ...extra,
    })
    const comments = [
        comment('ogólna', {}),
        comment('do zadania', { targetType: 'task', targetId: 't1', taskId: 't1' }),
        comment('załatwiona', { targetType: 'task', targetId: 't1', taskId: 't1', resolved: true, authorId: 'p' }),
        comment('do wymagania', { targetType: 'requirement', targetId: '1003' }),
        comment('inna próba', { rankInProgressId: 'x' }),
    ]
    const build = (extra: object = {}) =>
        buildAdvancementViewModel({
            rankInProgress: { id: 'r', rankId: 0, personId: 'p', mentorId: 'm', createdAt: 0 },
            tasks: [task],
            requirements: Requirement.list(),
            rank,
            person: { id: 'p', fullName: 'Jan' },
            mentor: { id: 'm', fullName: 'hm. Anna' },
            ...extra,
        })

    it('leaves comments out unless asked', () => {
        const model = build()
        expect(model.includeComments).toBe(false)
        expect(model.tasks[0]!.comments).toEqual([])
        const json = JSON.stringify(buildDocDefinition(model, { layout: 'table', labels, background: false }))
        expect(json).not.toContain('do zadania')
    })

    it('groups comments by target, with role, current author name and scope', () => {
        const all = build({ comments, people: [{ id: 'm', fullName: 'hm. Anna' }, { id: 'p', fullName: 'Jan' }], commentScope: 'all' })
        expect(all.generalComments.map((c) => c.content)).toEqual(['ogólna'])
        expect(all.tasks[0]!.comments).toMatchObject([
            { content: 'do zadania', author: 'hm. Anna', role: 'mentor', resolved: false },
            { content: 'załatwiona', author: 'Jan', role: 'mentee', resolved: true },
        ])
        expect(all.requirements.find((r) => r.id === 1003)!.comments.map((c) => c.content)).toEqual(['do wymagania'])
        const open = build({ comments, commentScope: 'open' })
        expect(open.tasks[0]!.comments.map((c) => c.content)).toEqual(['do zadania'])
        expect(open.tasks[0]!.comments[0]!.author).toBe('stara nazwa')
    })

    it('table layout: appendix with references; list layout: under the task', () => {
        const model = build({ comments, commentScope: 'all' })
        const table = JSON.stringify(buildDocDefinition(model, { layout: 'table', labels, background: false }))
        expect(table).toContain('"Uwagi"')
        expect(table).toContain('Zad. 1')
        expect(table).toContain('Wym. ')
        expect(table).toContain('Ogólne')
        expect(table).toContain('załatwione')
        expect(table).not.toContain('inna próba')

        const list = buildDocDefinition(model, { layout: 'simple', labels, background: false })
        const content = list.content as Array<Record<string, unknown>>
        const tasksSection = JSON.stringify(content.find((c) => c.pageBreak === 'before'))
        expect(tasksSection).toContain('do zadania')
        expect(tasksSection).not.toContain('do wymagania')
        expect(JSON.stringify(list)).toContain('do wymagania')
    })
})
