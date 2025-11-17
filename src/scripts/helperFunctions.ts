import {Task, TaskDTO} from "@/scripts/Model/Task.js";
import {Status} from "@/scripts/Model/Status.js";
import {Rank, RankDTO} from "@/scripts/Model/Rank.js";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser.js";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement.js";
import {TaskCommentDTO, TaskComment} from "@/scripts/Model/TaskComment.js";
import {Ref} from "vue";

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

export async function saveDatabaseData(): Promise<void> {
    const [users, ranks, requirements, ranksInProgress, tasks] = await Promise.all([
        AppUser.getAll(),
        Rank.getAll(),
        Requirement.getAll(),
        RankInProgress.getAll(),
        Task.getAll()
    ]);

    console.log("Saving users to local storage:", users)
    window.localStorage.setItem("Users", JSON.stringify(users));
    console.log("Saving ranks to local storage:", ranks)
    window.localStorage.setItem("Ranks", JSON.stringify(ranks));
    console.log("Saving requirements to local storage:", requirements)
    window.localStorage.setItem("Requirements", JSON.stringify(requirements));
    console.log("Saving ranks in progress to local storage:", ranksInProgress)
    window.localStorage.setItem("RanksInProgress", JSON.stringify(ranksInProgress));
    console.log("Saving tasks to local storage:", tasks)
    window.localStorage.setItem("Tasks", JSON.stringify(tasks));
    console.log("Saving comments to local storage:", tasks)
    window.localStorage.setItem("TaskComments", JSON.stringify(tasks));
}

export async function loadDatabaseData() : Promise<void>{
    const promises: Promise<any>[] = [];

  const parseStored = <T>(key: string): T[] => {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            console.log(`Loading ${key} from storage: `, parsed);
            if (Array.isArray(parsed)) return parsed as T[];
            if (parsed && typeof parsed === "object") return Object.values(parsed) as T[];
        } catch (e) {
            console.warn(`Failed to parse localStorage key ${key}:`, e);
        }
        return [];
    };

    parseStored<AppUserDTO>("Users").forEach((user) => promises.push(AppUser.add(user)));
    parseStored<RankDTO>("Ranks").forEach((rank) => promises.push(Rank.add(rank)));
    parseStored<RequirementDTO>("Requirements").forEach((requirement) => promises.push(Requirement.add(requirement, requirement.rankId)));
    parseStored<RankInProgressDTO>("RanksInProgress").forEach((rip) => promises.push(RankInProgress.add(rip)));
    parseStored<TaskDTO>("Tasks").forEach((task) => promises.push(Task.add(task, task.rankInProgressId)));
    parseStored<TaskCommentDTO>("TaskComments").forEach((comment) => promises.push(TaskComment.add(comment, comment.taskId)));

    return Promise.all(promises).then(() => console.log("Loaded data from local storage"));
}

export function rankImage(rank : RankDTO) : string{
    if (!rank || !rank.shortName) return '';
    return new URL(`../assets/images/${rank.shortName}.png`, import.meta.url).href;
}

export function isDarkMode(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}