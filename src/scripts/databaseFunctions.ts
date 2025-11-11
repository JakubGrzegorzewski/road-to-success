import {RankDTO} from "@/scripts/Model/Rank";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {Status} from "@/scripts/Model/Status";

export function addTask(rankInProgressId : number, rank : RankDTO) : void {
    if (rank === undefined)
        return;
    let task: TaskDTO = {
        id: Math.floor(Math.random() * 1000000000000000),
        rankInProgressId: rankInProgressId,
        requirementsIds: [],
        content: "",
        status: Status.CREATED,
        partIdea: rank.idea,
        commentIds: [],
    };
    Task.add(task, rankInProgressId).then(
        () => {
            console.log("Task added successfully");
        },
        (error) => {
            console.error("Error adding task:", error);
        }
    )
}