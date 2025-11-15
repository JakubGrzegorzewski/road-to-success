import {saveDatabaseData} from "@/scripts/helperFunctions.js";

let ranks : RankDTO[] = []

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
        return Promise.resolve(ranks);
    }

    static getById(id: number): Promise<RankDTO> {
        return Promise.resolve(<RankDTO>ranks.find(rank => rank.id === id));
    }

    static add(rank: RankDTO): Promise<RankDTO> {
        const exists = ranks.some(r => r.id === rank.id);
        if (!exists) {
            ranks.push(rank);
        }
        window.localStorage.setItem("Ranks", JSON.stringify(ranks));
        return Promise.resolve(rank);
    }

    static update(rank: RankDTO): Promise<RankDTO | undefined> {
        const index = ranks.findIndex(u => u.id === rank.id)
        if (index !== -1) {
            ranks[index] = rank;
            window.localStorage.setItem("Ranks", JSON.stringify(ranks));
            return Promise.resolve(rank);
        }
        window.localStorage.setItem("Ranks", JSON.stringify(ranks));
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number): void {
        ranks = ranks.filter(rank => rank.id !== id)
        window.localStorage.setItem("Ranks", JSON.stringify(ranks));
    }
}

