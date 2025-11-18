import rank from "@/assets/json/rank.json"

export interface RankDTO {
    id: number;
    fullName: string;
    shortName: string;
    idea: string;
    startRequirements: string[];
    endRequirements: string[];
    requirementIds: number[];
    ranksInProgressIds: number[];
}

export class Rank {
    static getAll(): Promise<RankDTO[]> {
        return new Promise(resolve => resolve(rank));
    }

    static async getById(id: number): Promise<RankDTO> {
        return this.getAll().then((ranks: RankDTO[]) => {
            const rank = ranks.find(rank => rank.id === id);
            if (!rank) throw new Error(`Rank with id ${id} not found`);
            return rank;
        });
    }
}

