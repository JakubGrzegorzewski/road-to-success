import {Task} from "@/scripts/Model/Task.js";

let comments : CommentDTO[] = []

export interface CommentDTO {
    id: number;
    date: string;
    content: string;
    taskId: number;
    userId: number;
}

export class TaskComment {
    static getAll(): Promise<CommentDTO[]> {
        return Promise.resolve(comments);
    }

    static getById(id: number): Promise<CommentDTO> {
        return Promise.resolve(<CommentDTO>comments.find(comment => comment.id === id));
    }

    static add(comment: CommentDTO, taskId : number): Promise<CommentDTO> {
        comments.push(comment)
        Task.getById(taskId).then(task => {
            task.commentIds.push(comment.id);
            Task.update(task);
        })
        return Promise.resolve(comment)
    }

    static update(comment: CommentDTO): Promise<CommentDTO | undefined> {
        const index = comments.findIndex(u => u.id === comment.id)
        if (index !== -1) {
            comments[index] = comment;
            return Promise.resolve(comment);
        }
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number, taskId : number): void {
        comments = comments.filter(comment => comment.id !== id)
        Task.getById(taskId).then(task => {
            task.commentIds = task.commentIds.filter(commentId => commentId !== id);
            Task.update(task);
        })
    }
}

