import {Task, TaskDTO} from "@/scripts/Model/Task.js";
import {Status} from "@/scripts/Model/Status.js";
import {Rank, RankDTO} from "@/scripts/Model/Rank.js";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser.js";
import {TaskCommentDTO, TaskComment} from "@/scripts/Model/TaskComment.js";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement.js";
import axios from 'axios'

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

        if (taskArray.length <= 0)
            return {
                data: {},
                status: '',
                statusText: 'By wygenerować plik należy dodać zadania',
                headers: {},
                config: {},
                request: {}
            }

        const exportedTasks = await Promise.all(taskArray.map(async (task: TaskDTO) => {
            return {
                content: (task.content || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim(),
                ideaPart: (task.partIdea || []).map(part => part.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim()),
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
            requirements: requirementArray.map( (req) => ({
                    number: req.number,
                    content: req.content,
                    isUsed: taskArray.some((task: TaskDTO) => task.requirementsIds.includes(req.id))
                })
            ).filter( (req) => req !== undefined),
        };

        console.log(JSON.stringify(exportedDocumentData));
        // Always use relative path - let the proxy handle it in dev, and server proxy in production
        const apiUrl = '/generate-pdf';

        const response = await axios.post(apiUrl, exportedDocumentData, {
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'blob'
        });

        if (!response.data) {
            console.error("Failed to generate PDF:", response.statusText);
            return response;
        }

        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${RankInProgressData.rankId || 'advancement'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        return response;
    } catch (err) {
        console.error("Error generating PDF:", err);
    }
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

        if (rank.id <= 5){
            rank = {
                id: rank.id,
                fullName: "",
                shortName: rank.shortName,
                idea: "",
                startRequirements: [],
                endRequirements: [],
                requirementIds: [],
                ranksInProgressIds: [],
                iconInBase64: "",
                backgroundInBase64: "",
                colorHex: "",
            }
            requirementArray = []
        }

        const exportData = {
            rank: rank ?? null,
            user: user ?? null,
            mentor: mentor ?? null,
            requirements: requirementArray,
            tasks: taskArray,
        };

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