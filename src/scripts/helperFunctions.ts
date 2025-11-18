import {Task, TaskDTO} from "@/scripts/Model/Task.js";
import {Status} from "@/scripts/Model/Status.js";
import {RankDTO} from "@/scripts/Model/Rank.js";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser.js";
import {TaskCommentDTO, TaskComment} from "@/scripts/Model/TaskComment.js";
import {RequirementDTO} from "@/scripts/Model/Requirement.js";

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

export function requirementSort(a: RequirementDTO, b: RequirementDTO) {
    if (Math.floor(parseFloat(a.number)) === Math.floor(parseFloat(b.number))) {
        const aNum = parseFloat(a.number.split('.')[1]);
        const bNum = parseFloat(b.number.split('.')[1]);
        if (isNaN(aNum) && isNaN(bNum)) {
            return 0;
        } else if (isNaN(aNum)) {
            return -1;
        } else if (isNaN(bNum)) {
            return 1;
        } else {
            return aNum - bNum;
        }
    }else {
        return parseFloat(a.number) - parseFloat(b.number)
    }
}

export async function fetchGET(url : string) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return await response.json();
    } catch (err) {
        console.error('Error fetching:', err);
        return null;
    }
}

export async function fetchDELETE(url : string) {
    try {
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return await response.json();
    } catch (err) {
        console.error('Error fetching:', err);
        return null;
    }
}

export async function fetchPUT(url : string, data : string) {
    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (err) {
        console.error('Error fetching:', err);
        return null;
    }
}

export async function fetchPOST(url : string, data : string) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (err) {
        console.error('Error fetching:', err);
        return null;
    }
}