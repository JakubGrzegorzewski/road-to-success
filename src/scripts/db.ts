import Dexie, { type Table } from 'dexie';
import type { IUser, IRank, IRankInProgress, ITask, ITaskComment, IRequirement } from './interfaces.ts';


class AppDatabase extends Dexie {
    // Define tables with their respective  types and primary key type (number)
    users!: Table<IUser, number>;
    ranks!: Table<IRank, number>;
    ranksInProgress!: Table<IRankInProgress, number>;
    requirements!: Table<IRequirement, number>;
    tasks!: Table<ITask, number>;
    taskComments!: Table<ITaskComment, number>;

    constructor() {
        super('RoadSuccessDB');
        // Define the schema. Only list primary keys and properties you will filter/query by.
        this.version(1).stores({
            users: '++id',
            ranks: '++id',
            ranksInProgress: '++id, rankId, userId, mentorId',
            requirements: '++id, rankId',
            tasks: '++id, rankInProgressId',
            taskComments: '++id, taskId, userId'
        });
    }
}

// Export a single database instance to use across your classes
export const db = new AppDatabase();