import { describe, expect, it } from 'vitest'
import { getIdeaSegments, getIdeaWithSelectedParts, taskIdeaFragments } from '@/scripts/helperFunctions'
import { buildAdvancementViewModel } from '@/scripts/pdf/advancementViewModel'
import { Status, type IRank, type ITask } from '@/scripts/interfaces'
import { Requirement } from '@/scripts/database/Requirement'
import { Rank } from '@/scripts/database/Rank'

const idea = 'Jest wzorem dla harcerzy. Bierze udział w życiu drużyny.'
const task = (partIdea: string[], extra: Partial<ITask> = {}): ITask => ({
    id: extra.id ?? Math.random().toString(36).slice(2),
    rankInProgressId: 'rip',
    requirementIds: [],
    content: '',
    status: Status.CREATED,
    partIdea,
    order: 0,
    createdAt: 0,
    ...extra,
})

describe('idea segments', () => {
    it('returns the idea unchanged when nothing is selected', () => {
        expect(getIdeaSegments(idea, [task(idea.split(' '))])).toEqual([{ text: idea, highlighted: false }])
        expect(taskIdeaFragments(task(idea.split(' ')), idea)).toEqual([])
    })

    it('highlights selected fragments and merges overlaps', () => {
        const segments = getIdeaSegments(idea, [task(['Jest wzorem']), task(['wzorem dla', 'drużyny.'])])
        expect(segments).toEqual([
            { text: 'Jest wzorem dla', highlighted: true },
            { text: ' harcerzy. Bierze udział w życiu ', highlighted: false },
            { text: 'drużyny.', highlighted: true },
        ])
    })

    it('escapes HTML in the compatibility helper', () => {
        expect(getIdeaWithSelectedParts({ idea: 'a <b> c' }, [task(['<b>'])])).toBe("a <span class='idea-part-highlight'>&lt;b&gt;</span> c")
    })
})

describe('advancement view model', () => {
    const rank: IRank = { ...Rank.find(0)! }
    const requirements = Requirement.findByRankId(0)

    it('builds rows for the requirement matrix and the task list', () => {
        const t1 = task(['Jest wzorem dla harcerzy.'], { id: 't1', content: 'Zbiórka', requirementIds: [1001, 1005], order: 1, status: Status.COMPLETED })
        const t2 = task(rank.idea.split(' '), { id: 't2', content: 'Biwak', requirementIds: [1005], order: 0 })
        const other = task([], { id: 'x', rankInProgressId: 'other' })
        const vm = buildAdvancementViewModel({
            rankInProgress: { id: 'rip', rankId: 0, personId: 'p', mentorId: 'm', createdAt: 0 },
            tasks: [t1, t2, other],
            requirements: Requirement.list(),
            rank,
            person: { id: 'p', fullName: ' Jan ' },
            mentor: null,
            now: new Date('2026-10-18T12:00:00Z'),
        })
        expect(vm.menteeName).toBe('Jan')
        expect(vm.mentorName).toBe('')
        expect(vm.tasks.map((t) => [t.index, t.content])).toEqual([[1, 'Biwak'], [2, 'Zbiórka']])
        expect(vm.tasks[1]!.ideaFragments).toEqual(['Jest wzorem dla harcerzy.'])
        expect(vm.tasks[0]!.ideaFragments).toEqual([])
        expect(vm.requirements).toHaveLength(requirements.length)
        const r1005 = vm.requirements.find((r) => r.id === 1005)!
        expect(r1005.tasks.map((t) => t.id)).toEqual(['t2', 't1'])
        expect(vm.requirements.find((r) => r.id === 1002)!.tasks).toEqual([])
        expect(vm.ideaSegments.some((s) => s.highlighted)).toBe(true)
    })

    it('numbers requirements that share the same label', () => {
        const ho = Rank.find(3)!
        const vm = buildAdvancementViewModel({
            rankInProgress: { id: 'r', rankId: 3, personId: '', mentorId: '', createdAt: 0 },
            tasks: [],
            requirements: Requirement.list(),
            rank: ho,
        })
        const labels = vm.requirements.map((r) => r.label)
        expect(new Set(labels).size).toBe(labels.length)
    })
})
