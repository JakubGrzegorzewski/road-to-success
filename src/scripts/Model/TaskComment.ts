import {Task} from "@/scripts/Model/Task.js";

let taskComments : TaskCommentDTO[] = []

export interface TaskCommentDTO {
    id: number;
    date: string;
    content: string;
    taskId: number;
    userId: number;
}

export class TaskComment {
    static getAll(): Promise<TaskCommentDTO[]> {
        return Promise.resolve(taskComments);
    }

    static getById(id: number): Promise<TaskCommentDTO> {
        return Promise.resolve(<TaskCommentDTO>taskComments.find(comment => comment.id === id));
    }

    static add(comment: TaskCommentDTO, taskId: number): Promise<TaskCommentDTO> {
        const exists = taskComments.some(c => c.id === comment.id);
        if (!exists) {
            taskComments.push(comment);
            Task.getById(taskId).then(task => {
                if (!task) return;
                if (!task.commentIds.includes(comment.id)) {
                    task.commentIds.push(comment.id);
                    Task.update(task);
                }
            });
        }
        window.localStorage.setItem("TaskComments", JSON.stringify(taskComments));
        return Promise.resolve(comment);
    }

    static update(comment: TaskCommentDTO): Promise<TaskCommentDTO | undefined> {
        const index = taskComments.findIndex(u => u.id === comment.id)
        if (index !== -1) {
            taskComments[index] = comment;
            window.localStorage.setItem("TaskComments", JSON.stringify(taskComments));
            return Promise.resolve(comment);
        }
        window.localStorage.setItem("TaskComments", JSON.stringify(taskComments));
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number, taskId : number): void {
        taskComments = taskComments.filter(comment => comment.id !== id)
        Task.getById(taskId).then(task => {
            task.commentIds = task.commentIds.filter(commentId => commentId !== id);
            Task.update(task);
        })
        window.localStorage.setItem("TaskComments", JSON.stringify(taskComments));
    }
}

