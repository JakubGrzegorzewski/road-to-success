import { getIdeaSegments, taskIdeaFragments, type IdeaSegment } from '@/scripts/helperFunctions'
import type { IComment, IRank, IRankInProgress, IRequirement, ITask, IUser, Status } from '@/scripts/interfaces'
import { requirementLabel } from '@/scripts/database/Requirement'
import { authorRole, groupByTarget } from '@/scripts/database/Comment'

/** Which comments go into the report. */
export type CommentScope = 'open' | 'all'

export interface CommentRow {
    id: string;
    author: string;
    role: 'mentor' | 'mentee' | null;
    /** ISO date of writing. */
    date: string;
    content: string;
    resolved: boolean;
    edited: boolean;
}

export interface RequirementRow {
    id: number;
    label: string;
    content: string;
    tasks: { id: string; content: string; status: Status }[];
    comments: CommentRow[];
}

export interface TaskRow {
    id: string;
    index: number;
    content: string;
    status: Status;
    ideaFragments: string[];
    requirements: { id: number; label: string; content: string }[];
    comments: CommentRow[];
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
    /** False when comments were not requested (the rows then have empty `comments`). */
    includeComments: boolean;
    /** "Uwagi ogólne" (comments on the advancement itself). */
    generalComments: CommentRow[];
    generatedAt: Date;
}

export interface AdvancementViewModelInput {
    rankInProgress: IRankInProgress;
    tasks: readonly ITask[];
    requirements: readonly IRequirement[];
    rank: IRank;
    person?: IUser | null;
    mentor?: IUser | null;
    /** Comments of the advancement; omit to leave them out of the report. */
    comments?: readonly IComment[];
    /** People for author names (falls back to the name stored with the comment). */
    people?: readonly IUser[];
    commentScope?: CommentScope;
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

    const includeComments = input.comments !== undefined
    const names = new Map((input.people ?? []).map((p) => [p.id, p.fullName.trim()]))
    const groups = groupByTarget(
        (input.comments ?? []).filter((c) => c.rankInProgressId === rankInProgress.id && (input.commentScope !== 'open' || !c.resolved)),
    )
    const rows = (key: Parameters<typeof groups.get>[0]): CommentRow[] =>
        (groups.get(key) ?? []).map((c) => ({
            id: c.id,
            author: names.get(c.authorId) || c.authorName,
            role: authorRole(c.authorId, rankInProgress),
            date: c.date,
            content: c.content,
            resolved: c.resolved,
            edited: !!c.editedAt,
        }))

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
            comments: rows(`req:${r.id}`),
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
            comments: rows(`task:${t.id}`),
        })),
        includeComments,
        generalComments: rows('adv'),
        generatedAt: input.now ?? new Date(),
    }
}
