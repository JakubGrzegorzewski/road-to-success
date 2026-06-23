import { db } from '../db';
import type {IRank} from '../interfaces';

export class Rank {
    static async getAll(): Promise<Array<IRank>> {
        return db.ranks.toArray();
    }

    static async getById(id: number): Promise<IRank> {
        const rank = await db.ranks.get(id);
        if (!rank) throw new Error(`rank with id ${id} not found`);
        return rank;
    }

    static async add(rank: IRank): Promise<IRank> {
        // .put adds if new, updates if key exists
        await db.ranks.put(rank);
        return rank;
    }

    static async update(rank: IRank): Promise<IRank | undefined> {
        const updatedRows = await db.ranks.update(rank.id as NonNullable<IRank["id"]>, rank as any);
        return updatedRows > 0 ? rank : undefined;
    }

    static async deleteObject(id: number): Promise<void> {
        await db.ranks.delete(id);
    }
}