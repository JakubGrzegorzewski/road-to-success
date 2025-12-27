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

export function rankImage(rank : RankDTO) : string{
    if (!rank || !rank.shortName) return '';
    if (rank.shortName === 'ho' || rank.shortName === 'hr') return new URL(`../assets/images/${rank.shortName}-${isDarkMode() ? 'light' : 'dark'}.png`, import.meta.url).href;

    return new URL(`../assets/images/${rank.shortName}.png`, import.meta.url).href;
}

export async function generatePDF(RankInProgressData: RankInProgressDTO){
    try {
        const [rank, user, mentor] = await Promise.all([
            Rank.getById(RankInProgressData.rankId),
            AppUser.getById(RankInProgressData.userId),
            AppUser.getById(RankInProgressData.mentorId),
        ]);

        if (!rank || !user || !mentor) {
            console.error("Missing data for PDF generation");
            return;
        }

        const requirementArray: RequirementDTO[] = (rank.requirementIds || []).length > 0
            ? (await Promise.all((rank.requirementIds || []).map(id => Requirement.getById(id)))).filter(Boolean) as RequirementDTO[]
            : [];

        const taskArray: TaskDTO[] = (RankInProgressData.taskIds || []).length > 0
            ? (await Promise.all((RankInProgressData.taskIds || []).map(id => Task.getById(id)))).filter(Boolean) as TaskDTO[]
            : [];



        const exportedTasks = await Promise.all(taskArray.map(async (task: TaskDTO) => {
            return {
                content: (task.content || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim(),
                ideaPart: (task.partIdea || []).map(part => part.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim()).join(' '),
                requirements: task.requirementsIds.map( (rid) => requirementArray.find(r => r.id === rid)),
            };
        }));



        const exportedDocumentData : object = {
            advancementName: rank.fullName,
            menteeName: user.fullName,
            mentorName: mentor.fullName,
            idea: rank.idea,
            themeColor: rank.colorHex,
            tasks: exportedTasks,
            imageBase64: rank.iconInBase64,
            backgroundImageBase64 : rank.backgroundInBase64,
            requirements: requirementArray.map( (req) => {
                    taskArray.some((task: TaskDTO) => task.requirementsIds.includes(req.id));req.number; req.content;
                }
            ).filter( (req) => req !== undefined),
        };

        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportedDocumentData),
        });

        if (!response.ok) {
            console.error("Failed to generate PDF:", response.statusText);
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${RankInProgressData.rankId || 'advancement'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error generating PDF:", err);
    }
}

export async function generateExport() {
    // Placeholder for export functionality
    console.log("Export functionality is not yet implemented.");
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