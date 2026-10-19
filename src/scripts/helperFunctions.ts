import type { ITask } from "@/scripts/interfaces.ts";

export function isDarkMode(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export interface IdeaSegment {
    text: string;
    highlighted: boolean;
}

/** True when `partIdea` is the whole idea split into words, i.e. no fragment was selected. */
export function isWholeIdea(partIdea: readonly string[], idea: string): boolean {
    return partIdea.length === idea.split(' ').length;
}

/** Idea fragments chosen for a task ([] when the task does not narrow the idea down). */
export function taskIdeaFragments(task: Pick<ITask, 'partIdea'>, idea: string): string[] {
    const parts = Array.isArray(task.partIdea) ? task.partIdea : [];
    if (!idea || isWholeIdea(parts, idea)) return [];
    return parts.map(p => (p ?? '').trim()).filter(p => p.length > 0 && p !== idea);
}

/**
 * Splits the rank idea into plain and highlighted segments: a part is highlighted when any task
 * selected it. Overlapping or touching fragments are merged. Shared by the screen and the PDF.
 */
export function getIdeaSegments(idea: string, tasks: readonly Pick<ITask, 'partIdea'>[]): IdeaSegment[] {
    const ideaText = idea ?? '';
    if (!ideaText) return [];

    type Range = { index: number; indexEnd: number };
    const raw: Range[] = [];
    for (const task of tasks) {
        for (const fragment of taskIdeaFragments(task, ideaText)) {
            let fromIndex = 0;
            while (true) {
                const idx = ideaText.indexOf(fragment, fromIndex);
                if (idx < 0) break;
                raw.push({ index: idx, indexEnd: idx + fragment.length });
                fromIndex = idx + fragment.length;
            }
        }
    }
    if (raw.length === 0) return [{ text: ideaText, highlighted: false }];

    raw.sort((a, b) => a.index - b.index);
    const merged: Range[] = [];
    for (const r of raw) {
        const last = merged[merged.length - 1];
        if (last && r.index <= last.indexEnd) last.indexEnd = Math.max(last.indexEnd, r.indexEnd);
        else merged.push({ ...r });
    }

    const segments: IdeaSegment[] = [];
    let cursor = 0;
    for (const r of merged) {
        if (r.index > cursor) segments.push({ text: ideaText.slice(cursor, r.index), highlighted: false });
        segments.push({ text: ideaText.slice(r.index, r.indexEnd), highlighted: true });
        cursor = r.indexEnd;
    }
    if (cursor < ideaText.length) segments.push({ text: ideaText.slice(cursor), highlighted: false });
    return segments;
}

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** HTML version of {@link getIdeaSegments} (escaped). Prefer rendering the segments directly. */
export function getIdeaWithSelectedParts(rank: { idea: string }, tasks: readonly Pick<ITask, 'partIdea'>[]): string {
    return getIdeaSegments(rank.idea, tasks)
        .map(s => (s.highlighted ? `<span class='idea-part-highlight'>${escapeHtml(s.text)}</span>` : escapeHtml(s.text)))
        .join('');
}
