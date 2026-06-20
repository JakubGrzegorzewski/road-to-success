import { db } from '../db';
import type { IRequirement } from '../interfaces';

export class Requirement {
    static async getAll(): Promise<Array<IRequirement>> {
        return db.requirements.toArray();
    }

    static async getById(id: number): Promise<IRequirement> {
        const requirement = await db.requirements.get(id);
        if (!requirement) throw new Error(`requirement with id ${id} not found`);
        return requirement;
    }

    static async add(requirement: IRequirement): Promise<IRequirement> {
        // .put adds if new, updates if key exists
        await db.requirements.put(requirement);
        return requirement;
    }

    static async update(requirement: IRequirement): Promise<IRequirement | undefined> {
        const updatedRows = await db.requirements.update(requirement.id as NonNullable<IRequirement["id"]>, requirement as any);
        return updatedRows > 0 ? requirement : undefined;
    }

    static async deleteObject(id: number): Promise<void> {
        await db.requirements.delete(id);
    }
}