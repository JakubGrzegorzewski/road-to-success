import { getIdeaSegments, taskIdeaFragments, type IdeaSegment } from '@/scripts/helperFunctions'
import type { IRank, IRankInProgress, IRequirement, ITask, IUser, Status } from '@/scripts/interfaces'
import { requirementLabel } from '@/scripts/database/Requirement'

export interface RequirementRow {
    id: number;
    label: string;
    content: string;
    tasks: { id: string; content: string; status: Status }[];
}

export interface TaskRow {
    id: string;
    index: number;
    content: string;
    status: Status;
    ideaFragments: string[];
    requirements: { id: number; label: string; content: string }[];
}

/** Everything a report needs, independent of how it is rendered (screen preview or PDF). */
export interface AdvancementViewModel {
    rankInProgressId: string;
    rank: {
        id: number;
        fullName: string;
        shortName: string;
        colorHex: string;
        idea: string;
        startRequirements: string[];
        endRequirements: string[];
    };
    menteeName: string;
    mentorName: string;
    ideaSegments: IdeaSegment[];
    requirements: RequirementRow[];
    tasks: TaskRow[];
    generatedAt: Date;
}

export interface AdvancementViewModelInput {
    rankInProgress: IRankInProgress;
    tasks: readonly ITask[];
    requirements: readonly IRequirement[];
    rank: IRank;
    person?: IUser | null;
    mentor?: IUser | null;
    now?: Date;
}

/** Pure function: (advancement, tasks, requirements, rank, mentee, mentor) → view model. */
export function buildAdvancementViewModel(input: AdvancementViewModelInput): AdvancementViewModel {
    const { rankInProgress, rank } = input
    const requirements = input.requirements.filter((r) => r.rankId === rank.id)
    const tasks = [...input.tasks]
        .filter((t) => t.rankInProgressId === rankInProgress.id)
        .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
    const labels = new Map(requirements.map((r) => [r.id, requirementLabel(r, requirements)]))

    return {
        rankInProgressId: rankInProgress.id,
        rank: {
            id: rank.id,
            fullName: rank.fullName,
            shortName: rank.shortName,
            colorHex: rank.colorHex,
            idea: rank.idea,
            startRequirements: [...rank.startRequirements],
            endRequirements: [...rank.endRequirements],
        },
        menteeName: input.person?.fullName?.trim() ?? '',
        mentorName: input.mentor?.fullName?.trim() ?? '',
        ideaSegments: getIdeaSegments(rank.idea, tasks),
        requirements: requirements.map((r) => ({
            id: r.id,
            label: labels.get(r.id) ?? r.number,
            content: r.content,
            tasks: tasks
                .filter((t) => t.requirementIds.includes(r.id))
                .map((t) => ({ id: t.id, content: t.content, status: t.status })),
        })),
        tasks: tasks.map((t, i) => ({
            id: t.id,
            index: i + 1,
            content: t.content,
            status: t.status,
            ideaFragments: taskIdeaFragments(t, rank.idea),
            requirements: requirements
                .filter((r) => t.requirementIds.includes(r.id))
                .map((r) => ({ id: r.id, label: labels.get(r.id) ?? r.number, content: r.content })),
        })),
        generatedAt: input.now ?? new Date(),
    }
}
