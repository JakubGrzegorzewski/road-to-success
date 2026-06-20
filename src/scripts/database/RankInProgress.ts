import { db } from '../db';
import type { IRankInProgress } from '../interfaces';

export class RankInProgress {
    static async getAll(): Promise<Array<IRankInProgress>> {
        return db.ranksInProgress.toArray();
    }

    static async getById(id: number): Promise<IRankInProgress> {
        const ranksInProgress = await db.ranksInProgress.get(id);
        if (!ranksInProgress) throw new Error(`ranksInProgress with id ${id} not found`);
        return ranksInProgress;
    }

    static async add(ranksInProgress: IRankInProgress): Promise<IRankInProgress> {
        // .put adds if new, updates if key exists
        await db.ranksInProgress.put(ranksInProgress);
        return ranksInProgress;
    }

    static async addDefault(): Promise<IRankInProgress>{
        const ranksInProgress: IRankInProgress = {
            id: 0,
            rankId: 0,
            userId: 0,
            mentorId: 0,
            taskIds: []
        };
        await db.ranksInProgress.add(ranksInProgress);
        return ranksInProgress;
    }

    static async update(ranksInProgress: IRankInProgress): Promise<IRankInProgress | undefined> {
        const updatedRows = await db.ranksInProgress.update(ranksInProgress.id as NonNullable<IRankInProgress["id"]>, ranksInProgress as any);
        return updatedRows > 0 ? ranksInProgress : undefined;
    }

    static async deleteObject(id: number): Promise<void> {
        await db.ranksInProgress.delete(id);
    }
}