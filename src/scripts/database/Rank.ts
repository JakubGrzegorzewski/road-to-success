import ranksData from '@/assets/json/ranks.json'
import type { IRank } from '../interfaces'

/**
 * Ranks are static data bundled with the app (never synchronised); records in the
 * Yjs document reference them by `rankId`. Images live in src/assets/ranks (see rankAssets.ts).
 */
const RANKS: readonly IRank[] = Object.freeze((ranksData as IRank[]).map((r) => Object.freeze({ ...r })))
const BY_ID = new Map(RANKS.map((r) => [r.id, r]))

export class Rank {
    static list(): readonly IRank[] {
        return RANKS
    }

    static find(id: number | undefined | null): IRank | undefined {
        return id === undefined || id === null ? undefined : BY_ID.get(id)
    }

    /** Rank used for new advancements. */
    static default(): IRank {
        return RANKS[0]!
    }

    static async getAll(): Promise<IRank[]> {
        return [...RANKS]
    }

    static async getById(id: number): Promise<IRank> {
        const rank = BY_ID.get(id)
        if (!rank) throw new Error(`rank with id ${id} not found`)
        return rank
    }
}
