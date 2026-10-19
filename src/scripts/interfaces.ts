// ==========================================
// 1. ENUMS
// ==========================================

export enum Status {
    DRAFT = 'DRAFT',
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export const ALL_STATUSES: readonly Status[] = Object.values(Status)

export function isStatus(value: unknown): value is Status {
    return typeof value === 'string' && (ALL_STATUSES as readonly string[]).includes(value)
}

// ==========================================
// 2. STATIC CATALOG (bundled JSON, never synchronised)
// ==========================================

export interface IRank {
    id: number;
    fullName: string;
    shortName: string;
    idea: string;
    startRequirements: string[];
    endRequirements: string[];
    colorHex: string;
}

export interface IRequirement {
    id: number;
    number: string;
    content: string;
    rankId: number;
}

// ==========================================
// 3. USER DATA (stored in the Yjs document, ids are UUIDs)
// ==========================================

/** A person: mentee (harcerz) or mentor (opiekun). Stored in the `people` map. */
export interface IUser {
    id: string;
    fullName: string;
}

export interface IRankInProgress {
    id: string;
    rankId: number;
    /** Mentee working on the rank. */
    personId: string;
    mentorId: string;
    createdAt: number;
}

export interface ITask {
    id: string;
    rankInProgressId: string;
    requirementIds: number[];
    content: string;
    status: Status;
    /**
     * Selected fragments of the rank idea. The full idea split into words means
     * "nothing selected yet" (kept for compatibility with data created before 2.0).
     */
    partIdea: string[];
    order: number;
    createdAt: number;
}

export interface ITaskComment {
    id: string;
    taskId: string;
    authorId: string;
    date: string;
    content: string;
}

// Attachments are out of scope for the first local-first version (phase 6).
export interface IAttachment {
    name: string;
    type: string;
    size: number;
    fileData: File;
}

export interface ITaskReport {
    id?: string;
    taskId: string;
    content: string;
    attachments: IAttachment[];
}
