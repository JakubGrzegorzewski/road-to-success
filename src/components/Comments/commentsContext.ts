import { inject, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { IComment, IRankInProgress, IUser } from '@/scripts/interfaces'
import type { CommentTargetKey } from '@/scripts/database/Comment'

/**
 * Shared state of the comment threads in one advancement view, provided by CreatingAdvancement.
 * Threads open inline (tasks on wide screens, general notes) or in a sheet (requirements, and tasks
 * on phones, where an expanded thread inside the card would make the page very long).
 */
export interface CommentsContext {
    rankInProgress: Ref<IRankInProgress | undefined>;
    people: Ref<IUser[]>;
    groups: ComputedRef<Map<CommentTargetKey, IComment[]>>;
    /** When this device last left the advancement (snapshot taken on entering the view). */
    seenAt: Ref<number | undefined>;
    /** Thread shown in the sheet (one at a time). */
    sheetKey: Ref<CommentTargetKey | null>;
    /** Threads expanded inline. */
    expanded: Ref<Set<CommentTargetKey>>;
    usesSheet(key: CommentTargetKey): boolean;
    isOpen(key: CommentTargetKey): boolean;
    toggle(key: CommentTargetKey): void;
    open(key: CommentTargetKey): void;
    /** Opens the thread and scrolls to its target. */
    reveal(key: CommentTargetKey): void;
    closeSheet(): void;
    /** "Zadanie 2", "Wymaganie 5", "Uwagi ogólne". */
    targetLabel(key: CommentTargetKey): string;
    /** Element id of the target (`zadanie-<uuid>`, `wymaganie-<id>`, `uwagi-ogolne`). */
    anchorId(key: CommentTargetKey): string;
    /** Absolute link that opens this thread (to send in a messenger). */
    linkFor(key: CommentTargetKey): string;
}

export const COMMENTS_CONTEXT: InjectionKey<CommentsContext> = Symbol('comments-context')

export function useCommentsContext(): CommentsContext {
    const ctx = inject(COMMENTS_CONTEXT)
    if (!ctx) throw new Error('comment components must be used inside an advancement view')
    return ctx
}

export function anchorIdFor(key: CommentTargetKey): string {
    if (key === 'adv') return 'uwagi-ogolne'
    if (key.startsWith('task:')) return `zadanie-${key.slice(5)}`
    return `wymaganie-${key.slice(4)}`
}

/** `#zadanie-<uuid>` / `#wymaganie-<id>` / `#uwagi-ogolne` → target key. */
export function keyFromHash(hash: string): CommentTargetKey | null {
    const h = decodeURIComponent(hash.replace(/^#/, ''))
    if (h === 'uwagi-ogolne') return 'adv'
    const task = /^zadanie-([\w-]+)$/.exec(h)
    if (task) return `task:${task[1]}`
    const req = /^wymaganie-(\d+)$/.exec(h)
    if (req) return `req:${Number(req[1])}`
    return null
}
