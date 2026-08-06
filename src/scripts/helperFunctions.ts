import {IRank, ITask} from "@/scripts/interfaces.ts";

export function isDarkMode(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getIdeaWithSelectedParts(rank : IRank, tasks : ITask[]) : string {
    type IdeaPart = { index: number; indexEnd: number };

    const ideaText = rank.idea ?? "";
    if (!ideaText) return "";

    const rawParts: IdeaPart[] = [];

    for (const task of tasks) {
        if (task.partIdea.length === rank.idea.split(" ").length) continue;
        const parts = Array.isArray((task as any).partIdea) ? ((task as any).partIdea as string[]) : [];
        const cleaned = parts.map(p => (p ?? "").trim()).filter(p => p.length > 0);
        if (cleaned.length === 0) continue;

        // Highlight each selected fragment separately (also works when there is a gap between fragments)
        for (const fragment of cleaned) {
            if (!fragment) continue;
            if (fragment === ideaText) continue;

            let fromIndex = 0;
            while (true) {
                const idx = ideaText.indexOf(fragment, fromIndex);
                if (idx < 0) break;

                rawParts.push({ index: idx, indexEnd: idx + fragment.length });
                fromIndex = idx + fragment.length;
            }
        }
    }

    if (rawParts.length === 0) return ideaText;

    rawParts.sort((a, b) => a.index - b.index);

    // Merge overlaps / touching ranges
    const merged: IdeaPart[] = [];
    for (const part of rawParts) {
        const last = merged[merged.length - 1];
        if (last && part.index <= last.indexEnd) {
            last.indexEnd = Math.max(last.indexEnd, part.indexEnd);
        } else {
            merged.push({ ...part });
        }
    }

    // Build HTML using range pointers (no per\-char .some() scans)
    let result = "";
    let rangeIndex = 0;

    for (let i = 0; i < ideaText.length; i++) {
        const range = merged[rangeIndex];

        if (range && i === range.index) result += "<span class='idea-part-highlight'>";
        result += ideaText[i];
        if (range && i + 1 === range.indexEnd) {
            result += "</span>";
            rangeIndex++;
        }
    }

    return result;
}