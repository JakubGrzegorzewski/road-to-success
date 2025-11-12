import {RankDTO} from "@/scripts/Model/Rank";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {Status} from "@/scripts/Model/Status";

export function addTaskToDB(rankInProgressId : number, rank : RankDTO, requirements : number[] = []) : Promise<TaskDTO> | undefined {
    if (rank === undefined)
        return;
    let task: TaskDTO = {
        id: Math.floor(Math.random() * 1000000000000000),
        rankInProgressId: rankInProgressId,
        requirementsIds: requirements,
        content: "",
        status: Status.CREATED,
        partIdea: rank.idea,
        commentIds: [],
    };
    return Task.add(task, rankInProgressId);
}