import { reactive } from 'vue'
import { getLocal, setLocal } from '@/scripts/store/localState'

/**
 * Per-device comment settings (never synchronised):
 * - who this device writes as ("Piszę jako") — a declaration, there are no accounts;
 * - when this device last left each advancement, for the "new since your last visit" dots.
 */
export const commentPrefs = reactive({
    authorId: '',
    seenAt: {} as Record<string, number>,
    loaded: false,
})

let loading: Promise<void> | null = null

export function loadCommentPrefs(): Promise<void> {
    loading ??= (async () => {
        const [authorId, seenAt] = await Promise.all([getLocal('commentAuthorId'), getLocal('commentsSeenAt')])
        commentPrefs.authorId = authorId ?? ''
        commentPrefs.seenAt = { ...(seenAt ?? {}) }
        commentPrefs.loaded = true
    })()
    return loading
}

export async function setCommentAuthor(personId: string): Promise<void> {
    commentPrefs.authorId = personId
    await setLocal('commentAuthorId', personId)
}

/** Everything in this advancement written until `at` counts as seen on this device. */
export async function markCommentsSeen(rankInProgressId: string, at = Date.now()): Promise<void> {
    await loadCommentPrefs()
    commentPrefs.seenAt = { ...commentPrefs.seenAt, [rankInProgressId]: at }
    await setLocal('commentsSeenAt', { ...commentPrefs.seenAt })
}

/** Tests only. */
export function __resetCommentPrefs(): void {
    loading = null
    commentPrefs.authorId = ''
    commentPrefs.seenAt = {}
    commentPrefs.loaded = false
}
