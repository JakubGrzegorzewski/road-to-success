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
    colorHex: string;
    iconInBase64 : string;
    backgroundInBase64: string;
}

export class Rank {
    static getAll(): Promise<RankDTO[]> {
        let localData = JSON.parse(window.localStorage.getItem("Ranks") || "[]") as RankDTO[];
        let staticData = rank as RankDTO[];
        return new Promise(resolve => resolve(
            [...staticData, ...localData.filter((localRank: RankDTO) => !staticData.some(staticRank => staticRank.id === localRank.id))]
        ));
    }

    static async getById(id: number): Promise<RankDTO> {
        return this.getAll().then((ranks: RankDTO[]) => {
            let rank = ranks.find(rank => rank.id === id);
            if (!rank) throw new Error(`Rank with id ${id} not found`);
            return rank;
        });
    }

    static add(rank: RankDTO): Promise<RankDTO> {
        let ranks = JSON.parse(window.localStorage.getItem("Ranks") || "[]") as RankDTO[];
        const exists = ranks.some(r => r.id === rank.id);
        if (!exists) {
            ranks.push(rank);
        }
        window.localStorage.setItem("Ranks", JSON.stringify(ranks));
        return Promise.resolve(rank);
    }

    static update(rank: RankDTO): Promise<RankDTO | undefined> {
        let ranks = JSON.parse(window.localStorage.getItem("Ranks") || "[]") as RankDTO[];
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
        let ranks = JSON.parse(window.localStorage.getItem("Ranks") || "[]") as RankDTO[];
        ranks = ranks.filter(rank => rank.id !== id)
        window.localStorage.setItem("Ranks", JSON.stringify(ranks));
    }
}

