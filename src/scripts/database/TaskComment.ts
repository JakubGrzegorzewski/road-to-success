import { db } from '../db';
import type { ITaskComment} from '../interfaces';

export class TaskComment {
    static async getAll(): Promise<Array<ITaskComment>> {
        return db.taskComments.toArray();
    }

    static async getById(id: number): Promise<ITaskComment> {
        const taskComment = await db.taskComments.get(id);
        if (!taskComment) throw new Error(`taskComment with id ${id} not found`);
        return taskComment;
    }

    static async add(taskComment: ITaskComment): Promise<ITaskComment> {
        // .put adds if new, updates if key exists
        await db.taskComments.put(taskComment);
        return taskComment;
    }

    static async update(taskComment: ITaskComment): Promise<ITaskComment | undefined> {
        const updatedRows = await db.taskComments.update(taskComment.id, taskComment);
        return updatedRows > 0 ? taskComment : undefined;
    }

    static async deleteObject(id: number): Promise<void> {
        await db.taskComments.delete(id);
    }
}