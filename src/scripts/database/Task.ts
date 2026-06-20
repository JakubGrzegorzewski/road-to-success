import { db } from '../db';
import type { ITask } from '../interfaces';

export class Task {
    static async getAll(): Promise<Array<ITask>> {
        return db.tasks.toArray();
    }

    static async getById(id: number): Promise<ITask> {
        const task = await db.tasks.get(id);
        if (!task) throw new Error(`task with id ${id} not found`);
        return task;
    }

    static async add(task: ITask): Promise<ITask> {
        // .put adds if new, updates if key exists
        await db.tasks.put(task);
        return task;
    }

    static async update(task: ITask): Promise<ITask | undefined> {
        const updatedRows = await db.tasks.update(task.id as NonNullable<ITask["id"]>, task as any);
        return updatedRows > 0 ? task : undefined;
    }

    static async deleteObject(id: number): Promise<void> {
        await db.tasks.delete(id);
    }
}