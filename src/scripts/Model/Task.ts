import {Status} from "@/scripts/Model/Status.js";
import {RankInProgress} from "@/scripts/Model/RankInProgress.js";

let tasks : TaskDTO[] = []

export interface TaskDTO {
    id: number;
    rankInProgressId: number;
    requirementsIds: number[];
    content: string;
    status: Status;
    partIdea: string;
    commentIds: number[];
}

export class Task {
    static getAll(): Promise<TaskDTO[]> {
        return Promise.resolve(tasks);
    }

    static getById(id: number): Promise<TaskDTO> {
        return Promise.resolve(<TaskDTO>tasks.find(task => task.id === id));
    }

    static add(task: TaskDTO, rankInProgressId: number): Promise<TaskDTO> {
        const exists = tasks.some(t => t.id === task.id);
        if (!exists) {
            tasks.push(task);
            RankInProgress.getById(rankInProgressId).then(rankInProgress => {
                if (!rankInProgress) return;
                if (!rankInProgress.taskIds.includes(task.id)) {
                    rankInProgress.taskIds.push(task.id);
                    RankInProgress.update(rankInProgress);
                }
            });
        }
        return Promise.resolve(task);
    }

    static update(task: TaskDTO): Promise<TaskDTO | undefined> {
        const index = tasks.findIndex(u => u.id === task.id)
        if (index !== -1) {
            tasks[index] = task;
            return Promise.resolve(task);
        }
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number, rankInProgressId : number): void {
        tasks = tasks.filter(task => task.id !== id)
        RankInProgress.getById(rankInProgressId).then(rankInProgress => {
            rankInProgress.taskIds = rankInProgress.taskIds.filter(taskId => taskId !== id);
            RankInProgress.update(rankInProgress);
        })
    }
}

