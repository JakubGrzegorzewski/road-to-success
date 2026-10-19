/**
 * Types and search over the help articles. Pure (no Vite, no DOM): used by help.ts, by the
 * Markdown build plugin (types) and by the unit tests. About 15 articles, so a filter in memory
 * is enough — no search library.
 */

export const HELP_CATEGORIES = ['start', 'proba', 'dane', 'aplikacja', 'problemy'] as const
export type HelpCategory = (typeof HELP_CATEGORIES)[number]

export interface HelpMeta {
    slug: string;
    /** Language folder the article comes from (src/help/<lang>). */
    lang: string;
    title: string;
    summary: string;
    category: HelpCategory;
    order: number;
    keywords: string[];
    related: string[];
}

export interface HelpHeading {
    id: string;
    text: string;
    level: number;
}

/** What `src/help/<lang>/<slug>.md?meta` exports. */
export interface HelpIndexEntry {
    meta: HelpMeta;
    headings: HelpHeading[];
    /** Plain text of the article. */
    text: string;
}

/** What `src/help/<lang>/<slug>.md` exports. */
export interface HelpArticle extends HelpIndexEntry {
    html: string;
}

export interface TextPart {
    text: string;
    match: boolean;
}

export interface HelpSearchResult {
    entry: HelpIndexEntry;
    score: number;
    /** Best matching section, if any (link target). */
    heading?: HelpHeading;
    title: TextPart[];
    summary: TextPart[];
    /** Fragment of the text around the first match ([] when only the title/keywords matched). */
    snippet: TextPart[];
}

/**
 * Lower case without diacritics, one output character per input character (so positions in the
 * normalised text are positions in the original): "Źródło" → "zrodlo".
 */
export function normalizeText(text: string): string {
    let out = ''
    for (const ch of text) {
        const lower = ch.toLowerCase()
        const base = lower === 'ł' ? 'l' : lower.normalize('NFD').replace(/[̀-ͯ]/g, '')
        // keep a 1:1 mapping (UTF-16 length) even for characters that decompose oddly
        out += base.length === ch.length ? base : ch.length === 1 ? (base[0] ?? ch) : ch
    }
    return out
}

export function queryTerms(query: string): string[] {
    return normalizeText(query)
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length > 0)
}

/** Splits `text` into parts, marking every occurrence of any term (diacritics-insensitive). */
export function highlight(text: string, terms: readonly string[]): TextPart[] {
    if (!text) return []
    const norm = normalizeText(text)
    const marks = new Array<boolean>(text.length).fill(false)
    for (const term of terms) {
        if (!term) continue
        let i = norm.indexOf(term)
        while (i >= 0) {
            for (let k = i; k < i + term.length; k++) marks[k] = true
            i = norm.indexOf(term, i + term.length)
        }
    }
    const parts: TextPart[] = []
    for (let i = 0; i < text.length; i++) {
        const last = parts[parts.length - 1]
        if (last && last.match === marks[i]) last.text += text[i]
        else parts.push({ text: text[i]!, match: marks[i]! })
    }
    return parts
}

function snippetAround(text: string, terms: readonly string[], radius = 70): TextPart[] {
    const norm = normalizeText(text)
    const positions = terms.map((t) => norm.indexOf(t)).filter((i) => i >= 0)
    if (positions.length === 0) return []
    const at = Math.min(...positions)
    let start = Math.max(0, at - radius)
    let end = Math.min(text.length, at + radius * 2)
    // cut at word boundaries
    if (start > 0) start = text.indexOf(' ', start) + 1 || start
    if (end < text.length) end = text.lastIndexOf(' ', end) > at ? text.lastIndexOf(' ', end) : end
    const parts = highlight(text.slice(start, end), terms)
    if (start > 0) parts.unshift({ text: '… ', match: false })
    if (end < text.length) parts.push({ text: ' …', match: false })
    return parts
}

/**
 * Every term must occur somewhere in the article; ranking: title > keywords > section headings >
 * summary > text. Ties keep the category/order of the help index.
 */
export function searchHelp(entries: readonly HelpIndexEntry[], query: string): HelpSearchResult[] {
    const terms = queryTerms(query)
    if (terms.length === 0) return []
    const results: HelpSearchResult[] = []
    entries.forEach((entry) => {
        const title = normalizeText(entry.meta.title)
        const summary = normalizeText(entry.meta.summary)
        const keywords = entry.meta.keywords.map(normalizeText)
        const headings = entry.headings.map((h) => normalizeText(h.text))
        const text = normalizeText(entry.text)
        let score = 0
        for (const term of terms) {
            let s = 0
            if (title.includes(term)) s += title.split(/\s+/).some((w) => w.startsWith(term)) ? 20 : 12
            if (keywords.some((k) => k === term)) s += 10
            else if (keywords.some((k) => k.includes(term))) s += 6
            if (headings.some((h) => h.includes(term))) s += 4
            if (summary.includes(term)) s += 3
            if (text.includes(term)) s += 1 + Math.min(3, text.split(term).length - 2)
            if (s === 0) return // all terms are required
            score += s
        }
        // the section matching the most words (the first one on a tie)
        let headingIndex = -1
        let best = 0
        headings.forEach((h, i) => {
            const hits = terms.filter((t) => h.includes(t)).length
            if (hits > best) [best, headingIndex] = [hits, i]
        })
        results.push({
            entry,
            score,
            heading: headingIndex >= 0 ? entry.headings[headingIndex] : undefined,
            title: highlight(entry.meta.title, terms),
            summary: highlight(entry.meta.summary, terms),
            snippet: title.includes(terms[0]!) ? [] : snippetAround(entry.text, terms),
        })
    })
    const position = new Map(entries.map((e, i) => [e, i]))
    return results.sort((a, b) => b.score - a.score || position.get(a.entry)! - position.get(b.entry)!)
}

/** Category order, then `order`, then title. */
export function sortHelpEntries<T extends { meta: HelpMeta }>(entries: readonly T[]): T[] {
    const cat = (c: HelpCategory) => HELP_CATEGORIES.indexOf(c)
    return [...entries].sort(
        (a, b) => cat(a.meta.category) - cat(b.meta.category) || a.meta.order - b.meta.order || a.meta.title.localeCompare(b.meta.title, 'pl'),
    )
}

/**
 * One entry per slug for `lang`; slugs without a translation use the Polish article
 * (`fallback: true`). Polish is the source of truth: a slug exists if its PL article exists.
 */
export function entriesForLanguage<T extends { meta: HelpMeta }>(all: readonly T[], lang: string): { entry: T; fallback: boolean }[] {
    const source = all.filter((e) => e.meta.lang === 'pl')
    return sortHelpEntries(source).map((pl) => {
        const translated = lang === 'pl' ? undefined : all.find((e) => e.meta.lang === lang && e.meta.slug === pl.meta.slug)
        return translated ? { entry: translated, fallback: false } : { entry: pl, fallback: lang !== 'pl' }
    })
}
