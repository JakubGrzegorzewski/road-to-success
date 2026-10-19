import requirementsData from '@/assets/json/requirements.json'
import type { IRequirement } from '../interfaces'

/** Requirements are static data bundled with the app; `rankId` matches `Rank.id`. */
const REQUIREMENTS: readonly IRequirement[] = Object.freeze((requirementsData as IRequirement[]).map((r) => Object.freeze({ ...r })))
const BY_ID = new Map(REQUIREMENTS.map((r) => [r.id, r]))

export class Requirement {
    static list(): readonly IRequirement[] {
        return REQUIREMENTS
    }

    static find(id: number): IRequirement | undefined {
        return BY_ID.get(id)
    }

    static findByRankId(rankId: number | undefined | null): IRequirement[] {
        if (rankId === undefined || rankId === null) return []
        return REQUIREMENTS.filter((r) => r.rankId === rankId)
    }

    static async getAll(): Promise<IRequirement[]> {
        return [...REQUIREMENTS]
    }

    static async getById(id: number): Promise<IRequirement> {
        const requirement = BY_ID.get(id)
        if (!requirement) throw new Error(`requirement with id ${id} not found`)
        return requirement
    }

    static async getByRankId(rankId: number): Promise<IRequirement[]> {
        return Requirement.findByRankId(rankId)
    }
}

/**
 * Display label of a requirement. Some ranks reuse the same `number` for several requirements
 * (e.g. "Zadania oparte na idei stopnia"), those get a running index: "2. Zadania…".
 */
export function requirementLabel(requirement: IRequirement, siblings: readonly IRequirement[]): string {
    const same = siblings.filter((r) => r.number === requirement.number)
    if (same.length <= 1) return requirement.number
    return `${same.findIndex((r) => r.id === requirement.id) + 1}. ${requirement.number}`
}
