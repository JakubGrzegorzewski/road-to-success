import {Status} from "@/scripts/Model/Status.js";
import {Style} from "@/scripts/Model/Style.js";


let ranksInProgress : RankInProgressDTO[] = []

export interface RankInProgressDTO {
    id: number;
    rankId: number;
    userId: number;
    mentorId: number;
    status: Status;
    style: Style;
    taskIds: number[];
}

export class RankInProgress {
    static getAll(): Promise<RankInProgressDTO[]> {
        return Promise.resolve(ranksInProgress);
    }

    static getById(id: number): Promise<RankInProgressDTO> {
        return Promise.resolve(<RankInProgressDTO>ranksInProgress.find(rankInProgress => rankInProgress.id === id));
    }

    static add(rankInProgress: RankInProgressDTO): Promise<RankInProgressDTO> {
        ranksInProgress.push(rankInProgress)
        return Promise.resolve(rankInProgress)
    }

    static update(rankInProgress: RankInProgressDTO): Promise<RankInProgressDTO | undefined> {
        const index = ranksInProgress.findIndex(u => u.id === rankInProgress.id)
        if (index !== -1) {
            ranksInProgress[index] = rankInProgress;
            return Promise.resolve(rankInProgress);
        }
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number): void {
        ranksInProgress = ranksInProgress.filter(rankInProgress => rankInProgress.id !== id)
    }
}

