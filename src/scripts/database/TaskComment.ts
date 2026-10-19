/**
 * Former name of the comment facade (comments used to belong to tasks only).
 * Kept as a re-export: `TaskComment.add({ taskId, authorId, content })`, `getAll()`, `getByTaskId()`
 * and `update()` keep working. New code imports `Comment` from './Comment'.
 */
export { Comment as TaskComment } from './Comment'
