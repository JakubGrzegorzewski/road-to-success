import {fetchGET} from "@/scripts/helperFunctions.js";

export interface RequirementDTO {
    id: number;
    number: string;
    content: string;
    rankId: number;
    taskIds: number[];
}

export class Requirement {
    static getAll(): Promise<RequirementDTO[]> {
        return fetchGET("/zhp/requirements.json");
    }

    static async getById(id: number): Promise<RequirementDTO> {
        return fetchGET("/zhp/requirements.json").then((ranks: RequirementDTO[]) => {
            const rank = ranks.find(rank => rank.id === id);
            if (!rank) throw new Error(`Rank with id ${id} not found`);
            return rank;
        });
    }
}

