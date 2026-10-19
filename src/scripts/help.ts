import { entriesForLanguage, type HelpArticle, type HelpIndexEntry } from './helpSearch'

/**
 * Help articles: src/help/<lang>/<slug>.md, compiled at build time by vite/helpMarkdown.ts.
 * The index (meta, headings, plain text for search) is part of this chunk; each article's HTML is
 * its own lazily loaded chunk. The service worker precaches all chunks, so help works offline.
 */
const index = import.meta.glob<HelpIndexEntry>('../help/*/*.md', { eager: true, query: '?meta', import: 'default' })
const articles = import.meta.glob<HelpArticle>('../help/*/*.md', { import: 'default' })

const ALL: HelpIndexEntry[] = Object.values(index)

/** Polish articles are the source; English (or another language) is used where translated. */
export function helpEntries(lang: string): { entry: HelpIndexEntry; fallback: boolean }[] {
    return entriesForLanguage(ALL, lang)
}

export function findHelpEntry(slug: string, lang: string): { entry: HelpIndexEntry; fallback: boolean } | undefined {
    return helpEntries(lang).find((e) => e.entry.meta.slug === slug)
}

export async function loadHelpArticle(slug: string, lang: string): Promise<{ article: HelpArticle; fallback: boolean } | null> {
    const found = findHelpEntry(slug, lang)
    if (!found) return null
    const load = articles[`../help/${found.entry.meta.lang}/${slug}.md`]
    if (!load) return null
    return { article: await load(), fallback: found.fallback }
}

/** "Zgłoś problem" under an article: a new GitHub issue with the article in the title. */
export const HELP_ISSUES_URL = 'https://github.com/JakubGrzegorzewski/road-to-success/issues/new'

export function helpFeedbackUrl(articleTitle: string, page: string): string {
    const params = new URLSearchParams({
        title: `Pomoc: ${articleTitle}`,
        body: `Poradnik: ${page}\n\nCo jest niejasne albo działa inaczej, niż opisano?\n\n`,
    })
    return `${HELP_ISSUES_URL}?${params.toString()}`
}
