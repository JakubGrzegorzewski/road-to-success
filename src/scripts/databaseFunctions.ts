import {Task, TaskDTO} from "@/scripts/Model/Task.js";
import {Status} from "@/scripts/Model/Status.js";
import {RankDTO} from "@/scripts/Model/Rank.js";

export function addTaskToDB(rankInProgressId : number, rank : RankDTO, requirements : number[] = []) : Promise<TaskDTO> | undefined {
    if (rank === undefined)
        return;
    console.log(rankInProgressId, rank, requirements)
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