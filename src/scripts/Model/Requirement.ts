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
        let localData = JSON.parse(window.localStorage.getItem("Requirements") || "[]") as RequirementDTO[];
        let staticData = requirements as RequirementDTO[];
        return new Promise(resolve => resolve(
            [...staticData, ...localData.filter((localRequirement: RequirementDTO) => !staticData.some(staticRequirement => staticRequirement.id === localRequirement.id))
            ]
        ));
    }

    static async getById(id: number): Promise<RequirementDTO> {
        return this.getAll().then((ranks: RequirementDTO[]) => {
            const rank = ranks.find(rank => rank.id === id);
            if (!rank) throw new Error(`Rank with id ${id} not found`);
            return rank;
        });
    }

    static add(requirement: RequirementDTO): Promise<RequirementDTO> {
        let requirements = JSON.parse(window.localStorage.getItem("Requirements") || "[]") as RequirementDTO[];
        const exists = requirements.some(r => r.id === requirement.id);
        if (!exists) {
            requirements.push(requirement);
        }
        window.localStorage.setItem("Requirements", JSON.stringify(requirements));
        return Promise.resolve(requirement);
    }

    static update(requirement: RequirementDTO): Promise<RequirementDTO | undefined> {
        let requirements = JSON.parse(window.localStorage.getItem("Requirements") || "[]") as RequirementDTO[];
        const index = requirements.findIndex(u => u.id === requirement.id)
        if (index !== -1) {
            requirements[index] = requirement;
            window.localStorage.setItem("Requirements", JSON.stringify(requirements));
            return Promise.resolve(requirement);
        }
        window.localStorage.setItem("Requirements", JSON.stringify(requirements));
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number): void {
        let requirements = JSON.parse(window.localStorage.getItem("Requirements") || "[]") as RequirementDTO[];
        requirements = requirements.filter(requirement => requirement.id !== id)
        window.localStorage.setItem("Requirements", JSON.stringify(requirements));
    }
}

