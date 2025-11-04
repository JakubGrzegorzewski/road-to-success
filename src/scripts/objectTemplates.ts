// Enums
export enum Status {
    DRAFT = 'DRAFT',
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum Style {
    NONE = 'NONE',
    IDEA_SELECTION = 'IDEA_SELECTION',
    ONE_TASK_ONE_REQUIREMENT = 'ONE_TASK_ONE_REQUIREMENT',
    ONE_TASK_MULTI_REQUIREMENTS = 'ONE_TASK_MULTI_REQUIREMENTS',
    ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA = 'ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA',
    MULTI_TASK_ONE_REQUIREMENT = 'MULTI_TASK_ONE_REQUIREMENT',
}

// Entity Types
export interface AppUser {
    id: number;
    fullName: string;
    email: string;
    password: string;
    role: string;
    ranksInProgress?: RankInProgress[];
    mentorRanksInProgress?: RankInProgress[];
    comments?: TaskComment[];
}

export interface TaskComment {
    id: number;
    date: string;
    user: AppUser;
    content: string;
    task: Task;
}

export interface Rank {
    id: number;
    fullName: string;
    shortName: string;
    idea: string;
    startRequirements: string[];
    endRequirements: string[];
    requirements?: Requirement[];
    ranksInProgress?: RankInProgress[];
}

export interface RankInProgress {
    id: number;
    rank: Rank;
    user: AppUser;
    mentor: AppUser;
    status: Status;
    style: Style;
    tasks?: Task[];
}

export interface Requirement {
    id: number;
    number: string;
    content: string;
    rank: Rank;
    tasks?: Task[];
}

export interface Task {
    id: number;
    rankInProgress: RankInProgress;
    requirements: Requirement[];
    content: string;
    status: Status;
    partIdea: string;
    comments: TaskComment[];
}
