import { Rank } from "./Rank.js";
let requirements : RequirementDTO[] = []

export interface RequirementDTO {
    id: number;
    number: string;
    content: string;
    rankId: number;
    taskIds: number[];
}

export class Requirement {
    static getAll(): Promise<RequirementDTO[]> {
        return Promise.resolve(requirements);
    }

    static getById(id: number): Promise<RequirementDTO> {
        return Promise.resolve(<RequirementDTO>requirements.find(requirement => requirement.id === id));
    }

    static add(requirement: RequirementDTO, rankId : number): Promise<RequirementDTO> {
        const exists = requirements.some(r => r.id === requirement.id);
        if (!exists) {
            requirements.push(requirement);
            Rank.getById(rankId).then(rank => {
                if (!rank.requirementIds.includes(requirement.id)) {
                    rank.requirementIds.push(requirement.id);
                    Rank.update(rank);
                }
            });
        }
        return Promise.resolve(requirement);
    }

    static update(requirement: RequirementDTO): Promise<RequirementDTO | undefined> {
        const index = requirements.findIndex(u => u.id === requirement.id)
        if (index !== -1) {
            requirements[index] = requirement;
            return Promise.resolve(requirement);
        }
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number, rankId : number): void {
        requirements = requirements.filter(requirement => requirement.id !== id)
        Rank.getById(rankId).then(rank => {
            rank.requirementIds = rank.requirementIds.filter(requirementId => requirementId !== id);
            Rank.update(rank);
        })
    }
}

