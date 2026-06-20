import { db } from '../db';
import type { IUser } from '../interfaces';

export class User {
    static async getAll(): Promise<Array<IUser>> {
        return db.users.toArray();
    }

    static async getById(id: number): Promise<IUser> {
        const user = await db.users.get(id);
        if (!user) throw new Error(`User with id ${id} not found`);
        return user;
    }

    static async add(user: IUser): Promise<IUser> {
        // .put adds if new, updates if key exists
        await db.users.put(user);
        return user;
    }

    static async update(user: IUser): Promise<IUser | undefined> {
        const updatedRows = await db.users.update(user.id as NonNullable<IUser["id"]>, user as any);
        return updatedRows > 0 ? user : undefined;
    }

    static async deleteObject(id: number): Promise<void> {
        await db.users.delete(id);
    }
}