import {fetchGET, jsonSubPage} from "@/scripts/helperFunctions.js";

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
        return fetchGET(jsonSubPage+"advancements.json");
    }

    static async getById(id: number): Promise<RankDTO> {
        return fetchGET(jsonSubPage+"advancements.json").then((ranks: RankDTO[]) => {
            const rank = ranks.find(rank => rank.id === id);
            if (!rank) throw new Error(`Rank with id ${id} not found`);
            return rank;
        });
    }
}

