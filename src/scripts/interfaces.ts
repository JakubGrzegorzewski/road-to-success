// ==========================================
// 1. ENUMS (From Status.ts & Style.ts)
// ==========================================

export enum Status {
    DRAFT = 'DRAFT',
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}


// ==========================================
// 2. DATA TRANSFER OBJECTS (DTOs)
// ==========================================

export interface IUser {
    id?: number;
    fullName: string;
    ranksInProgressIds: number[];
    mentorRanksInProgressIds: number[];
    commentIds: number[];
}

export interface IRank {
    id?: number;
    fullName: string;
    shortName: string;
    idea: string;
    startRequirements: string[];
    endRequirements: string[];
    requirementIds: number[];
    ranksInProgressIds: number[];
    colorHex: string;
    iconInBase64: string;
    backgroundInBase64: string;
}

export interface IRankInProgress {
    id?: number;
    rankId: number;
    userId: number;
    mentorId: number;
    taskIds: number[];
}

export interface IRequirement {
    id?: number;
    number: string;
    content: string;
    rankId: number;
    taskIds: number[];
}

export interface ITask {
    id?: number;
    rankInProgressId: number;
    requirementsIds: number[];
    content: string;
    status: Status; // Uses the Status Enum above
    partIdea: string[];
    commentIds: number[];
}

export interface ITaskComment{
    id?: number;
    date: string;
    content: string;
    taskId: number;
    userId: number;
}