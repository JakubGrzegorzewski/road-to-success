import {Task, TaskDTO} from "@/scripts/Model/Task.js";
import {Status} from "@/scripts/Model/Status.js";
import {Rank, RankDTO} from "@/scripts/Model/Rank.js";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser.js";
import {TaskCommentDTO, TaskComment} from "@/scripts/Model/TaskComment.js";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement.js";

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
        partIdea: rank.idea.split(" "),
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

export async function generateExport(RankInProgressData: RankInProgressDTO) {
    try {
        let [rank, user, mentor] = await Promise.all([
            Rank.getById(RankInProgressData.rankId),
            AppUser.getById(RankInProgressData.userId),
            AppUser.getById(RankInProgressData.mentorId),
        ]);

        let requirementArray: RequirementDTO[] = (rank?.requirementIds || []).length > 0
            ? (await Promise.all((rank!.requirementIds || []).map(id => Requirement.getById(id)))).filter(Boolean) as RequirementDTO[]
            : [];

        let taskArray: TaskDTO[] = (RankInProgressData.taskIds || []).length > 0
            ? (await Promise.all((RankInProgressData.taskIds || []).map(id => Task.getById(id)))).filter(Boolean) as TaskDTO[]
            : [];


        let exportData = {};

        if (rank.id <= 5){
            exportData = {
                rankInProgress: RankInProgressData,
                user: user ?? null,
                mentor: mentor ?? null,
                tasks: taskArray,
            };
        }else {
            exportData = {
                rankInProgress: RankInProgressData,
                user: user ?? null,
                mentor: mentor ?? null,
                tasks: taskArray,
                requirements: requirementArray,
                rank: rank
            }
        }



        try {
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Próba_${rank.shortName || 'advancement'}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to export', e);
        }

    } catch (err) {
        console.error("Error generating export:", err);
    }
}

export async function generateImport(): Promise<RankInProgressDTO | null> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json';
        input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
            resolve(null);
            return;
        }

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            const promises: Promise<any>[] = [];

            if (importData.rank) {
                const existing = await Rank.getById(importData.rank.id);
                if (existing) {
                    promises.push(Rank.update(importData.rank as RankDTO));
                } else {
                    promises.push(Rank.add(importData.rank as RankDTO));
                }
            }

            if (importData.requirements && Array.isArray(importData.requirements)) {
                for (const req of importData.requirements as RequirementDTO[]) {
                    const existing = await Requirement.getById(req.id);
                    if (existing) {
                        promises.push(Requirement.update(req));
                    } else {
                        promises.push(Requirement.add(req));
                    }
                }
            }

            if (importData.user) {
                const existing = await AppUser.getById(importData.user.id);
                if (existing) {
                    promises.push(AppUser.update(importData.user as AppUserDTO));
                } else {
                    promises.push(AppUser.add(importData.user as AppUserDTO));
                }
            }

            if (importData.mentor) {
                const mentor = importData.mentor as AppUserDTO;
                if (mentor.id !== importData.user?.id) {
                    const existing = await AppUser.getById(mentor.id);
                    if (existing) {
                        promises.push(AppUser.update(mentor));
                    } else {
                        promises.push(AppUser.add(mentor));
                    }
                }
            }

            if (importData.rankInProgress) {
                const existing = await RankInProgress.getById(importData.rankInProgress.id);
                if (existing) {
                    promises.push(RankInProgress.update(importData.rankInProgress as RankInProgressDTO));
                } else {
                    promises.push(RankInProgress.add(importData.rankInProgress as RankInProgressDTO));
                }
            }

            if (importData.tasks && Array.isArray(importData.tasks)) {
                for (const task of importData.tasks as TaskDTO[]) {
                    const existing = await Task.getById(task.id);
                    if (existing) {
                        promises.push(Task.update(task));
                    } else {
                        promises.push(Task.add(task, task.rankInProgressId));
                    }
                }
            }

            await Promise.all(promises);
            console.log("Import successful");
            resolve(importData.rankInProgress ?? null);
        } catch (e) {
            console.error('Failed to import', e);
            reject(e);
        }
    };

    input.click();
});
}

export function isDarkMode(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}