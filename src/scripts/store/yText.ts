import type * as Y from 'yjs'

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff
const isLowSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff

export interface TextChange {
    index: number;
    deleteCount: number;
    insert: string;
}

/**
 * Minimal single-range change turning `prev` into `next` (common prefix/suffix trimmed),
 * never splitting a UTF-16 surrogate pair.
 */
export function diffStrings(prev: string, next: string): TextChange | null {
    if (prev === next) return null
    let start = 0
    const max = Math.min(prev.length, next.length)
    while (start < max && prev.charCodeAt(start) === next.charCodeAt(start)) start++
    if (start > 0 && isHighSurrogate(prev.charCodeAt(start - 1))) start--

    let endPrev = prev.length
    let endNext = next.length
    while (endPrev > start && endNext > start && prev.charCodeAt(endPrev - 1) === next.charCodeAt(endNext - 1)) {
        endPrev--
        endNext--
    }
    if (endPrev < prev.length && isLowSurrogate(prev.charCodeAt(endPrev))) {
        endPrev++
        endNext++
    }
    return { index: start, deleteCount: endPrev - start, insert: next.slice(start, endNext) }
}

/**
 * Applies the edit that turns the current Y.Text content into `next` as a minimal
 * delete+insert, so concurrent edits by other people in other parts of the text merge
 * character by character instead of overwriting each other.
 */
export function applyStringToYText(ytext: Y.Text, next: string, origin: unknown): boolean {
    const change = diffStrings(ytext.toString(), next)
    if (!change) return false
    const apply = () => {
        if (change.deleteCount > 0) ytext.delete(change.index, change.deleteCount)
        if (change.insert.length > 0) ytext.insert(change.index, change.insert)
    }
    if (ytext.doc) ytext.doc.transact(apply, origin)
    else apply()
    return true
}

/**
 * Maps a cursor position through a Y.Text delta (remote change), keeping the caret where
 * the user expects it while someone else types in the same field.
 */
export function transformPosition(position: number, delta: Array<{ insert?: unknown; delete?: number; retain?: number }>): number {
    let oldIndex = 0
    let shift = 0
    for (const op of delta) {
        if (oldIndex > position) break
        if (op.retain !== undefined) {
            oldIndex += op.retain
        } else if (op.insert !== undefined) {
            const len = typeof op.insert === 'string' ? op.insert.length : 1
            if (oldIndex < position) shift += len
        } else if (op.delete !== undefined) {
            if (oldIndex < position) shift -= Math.min(op.delete, position - oldIndex)
            oldIndex += op.delete
        }
    }
    return Math.max(0, position + shift)
}
