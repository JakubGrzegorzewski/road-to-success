import requirements from "@/assets/json/requirements.json"

export interface RequirementDTO {
    id: number;
    number: string;
    content: string;
    rankId: number;
    taskIds: number[];
}

export class Requirement {
    static getAll(): Promise<RequirementDTO[]> {
        return new Promise(resolve => resolve(requirements));
    }

    static async getById(id: number): Promise<RequirementDTO> {
        return this.getAll().then((ranks: RequirementDTO[]) => {
            const rank = ranks.find(rank => rank.id === id);
            if (!rank) throw new Error(`Rank with id ${id} not found`);
            return rank;
        });
    }
}

