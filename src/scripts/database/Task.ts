import {db} from '../db';
import {IRequirement, ITask, Status} from '../interfaces';
import {Requirement} from "@/scripts/database/Requirement.ts";
import {eventBus, ITypesEnum} from "@/main.ts";
import {RankInProgress} from "@/scripts/database/RankInProgress.ts";

export class Task {
    static async getAll(): Promise<Array<ITask>> {
        eventBus.emit('db-update', { type: ITypesEnum.ETask});
        return db.tasks.toArray();
    }

    static async getById(id: number): Promise<ITask> {
        const task = await db.tasks.get(id);
        if (!task) throw new Error(`task with id ${id} not found`);
        eventBus.emit('db-update', { type: ITypesEnum.ETask});
        return task;
    }

    static async getByRankInProgressId(id: number): Promise<ITask[]>{
        return db.tasks.where('rankInProgressId').equals(id).toArray();
    }

    static async getRequirementStatus(id:number, rankId:number): Promise<{isCompleted: boolean, requirement : IRequirement}[]>{
        const task = await db.tasks.get(id);
        if (!task) throw new Error(`task with id ${id} not found`);
        const requirements = await Requirement.getByRankId(rankId);
        const returnValues: {isCompleted: boolean, requirement : IRequirement}[] = [];

        requirements.forEach(req => {
            returnValues.push({isCompleted: task.requirementsIds.includes(<number>req.id), requirement: req});
        });
        eventBus.emit('db-update', { type: ITypesEnum.ETask});
        return returnValues;
    }

    static async add(rankInProgressId: number | undefined): Promise<ITask>{

        // validate data
        if (rankInProgressId === undefined) throw new Error(`rankInProgressId is undefined`);
        const rankInProgress = await db.ranksInProgress.get(rankInProgressId);
        if (!rankInProgress) throw new Error(`rankInProgress with id ${rankInProgressId} not found`);
        const rank = await db.ranks.get(rankInProgress.rankId);
        if (!rank) throw new Error(`rank with id ${rankInProgress.rankId} not found`);

        // create new task
        const task: Omit<ITask, 'id'> = {
            rankInProgressId: rankInProgressId,
            requirementsIds: [],
            content: "",
            status: Status.CREATED,
            partIdea: rank.idea.split(' '),
            commentIds: []
        }

        // add new task to db
        const generatedId = await db.tasks.add(task);

        // update rankInProgress
        rankInProgress.taskIds.push(generatedId);
        await RankInProgress.update(rankInProgress);


        eventBus.emit('db-update', { type: ITypesEnum.ETask});
        return { id: generatedId, ...task }

    }

    static async update(task: ITask | undefined): Promise<ITask | undefined> {
        if (task == undefined) throw new Error('While trying to update task, passed undefined');
        const plainTask = JSON.parse(JSON.stringify(task));

        const updatedRows = await db.tasks.update(
            plainTask.id as NonNullable<ITask["id"]>,
            plainTask
        );
        eventBus.emit('db-update', { type: ITypesEnum.ETask});
        return updatedRows > 0 ? task : undefined;
    }

    static async deleteObject(id: number | undefined): Promise<void> {

        // validate data
        if (id == undefined) throw new Error(`id ${id} not found`);
        const task = await db.tasks.get(id);
        if (!task) throw new Error(`task with id ${id} not found`);

        // delete associated comments
        db.taskComments.bulkDelete(task.commentIds)

        // update tasks in rankInProgress
        const rankInProgress = await RankInProgress.getById(task.rankInProgressId);
        rankInProgress.taskIds.splice(rankInProgress.taskIds.indexOf(id), 1);
        await RankInProgress.update(rankInProgress);

        // remove from db and emmit it
        await db.tasks.delete(id);
        eventBus.emit('db-update', { type: ITypesEnum.ETask});
    }
}