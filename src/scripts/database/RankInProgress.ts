import { db } from '../db';
import type {IRankInProgress, IRequirement} from '../interfaces';
import {Requirement} from "@/scripts/database/Requirement.ts";
import {Task} from "@/scripts/database/Task.ts";
import {eventBus, ITypesEnum} from "@/main.ts";
import {User} from "@/scripts/database/User.ts";

export class RankInProgress {
    static async getAll(): Promise<Array<IRankInProgress>> {
        return db.ranksInProgress.toArray();
    }

    static async getById(id: number): Promise<IRankInProgress> {
        const ranksInProgress = await db.ranksInProgress.get(id);
        if (!ranksInProgress) throw new Error(`ranksInProgress with id ${id} not found`);
        return ranksInProgress;
    }

    static async getRequirementsStatuses(id:number): Promise<{isCompleted: boolean, requirement : IRequirement}[]>{
        const rankInProgress = await db.ranksInProgress.get(id);
        if (!rankInProgress) throw new Error(`task with id ${id} not found`);
        const requirements = await Requirement.getByRankId(rankInProgress.rankId);
        const tasks = await Task.getByRankInProgressId(id);
        const returnValues: {isCompleted: boolean, requirement : IRequirement}[] = [];

        requirements.forEach(req => {
            tasks.forEach((task) => {
                if (task.requirementsIds.includes(<number>req.id)) {
                    returnValues.push({isCompleted: true, requirement: req});
                    return
                }
            })
        });

        return returnValues;
    }

    static async add(ranksInProgress: IRankInProgress): Promise<IRankInProgress> {
        // .put adds if new, updates if key exists
        await db.ranksInProgress.put(ranksInProgress);
        eventBus.emit('db-update', { type: ITypesEnum.ERankInProgress});
        return ranksInProgress;
    }

    static async addDefault(): Promise<IRankInProgress> {
        const iUsers = await User.getAll();
        if (iUsers.length === 0) throw new Error('No users')
        if (iUsers[0] === null || iUsers[0] === undefined) throw new Error('No users')
        const newRankData: Omit<IRankInProgress, 'id'> = {
            rankId: 0,
            userId: <number>iUsers[0].id,
            mentorId: <number>iUsers[0].id,
            taskIds: []
        };


        const generatedId = await db.ranksInProgress.add(newRankData);

        console.log(`Added new rankInProgress with id ${generatedId}`);
        eventBus.emit('db-update', { type: ITypesEnum.ERankInProgress});

        return { id: generatedId, ...newRankData };
    }


    static async update(ranksInProgress: IRankInProgress | undefined): Promise<IRankInProgress | undefined> {
        if (ranksInProgress == undefined && ranksInProgress == null) throw new Error(`ranksInProgress is undefined`);
        const currentRIN = await RankInProgress.getById(<number>ranksInProgress.id);
        if (currentRIN?.rankId !== ranksInProgress.rankId && currentRIN?.taskIds) {
            await Promise.all(
                currentRIN.taskIds.map(taskId => Task.deleteObject(taskId))
            );
        }
        const plainRankInProgress = JSON.parse(JSON.stringify(ranksInProgress));
        const updatedRows = await db.ranksInProgress.update(
            ranksInProgress.id as NonNullable<IRankInProgress["id"]>,
            plainRankInProgress);

        eventBus.emit('db-update', { type: ITypesEnum.ERankInProgress});
        return updatedRows > 0 ? ranksInProgress : undefined;
    }

    static async deleteObject(id: number): Promise<void> {
        await db.ranksInProgress.delete(id);
        eventBus.emit('db-update', { type: ITypesEnum.ERankInProgress});
    }
}