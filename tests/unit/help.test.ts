import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileHelpMarkdown, type CompiledHelp } from '../../vite/helpMarkdown'

/**
 * Consistency of the help content: every "related" article, every link inside an article and every
 * contextual "?" (<HelpLink to="slug#section">) in a component points at an existing article and
 * section. Fails when someone renames a heading and breaks a link.
 */
const ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '')
const HELP = join(ROOT, 'src/help')

function load(lang: string): Map<string, CompiledHelp> {
    const dir = join(HELP, lang)
    const out = new Map<string, CompiledHelp>()
    if (!existsSync(dir)) return out
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
        const file = join(dir, name)
        out.set(name.replace(/\.md$/, ''), compileHelpMarkdown(readFileSync(file, 'utf8'), file))
    }
    return out
}

function vueFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const p = join(dir, name)
        return statSync(p).isDirectory() ? vueFiles(p) : p.endsWith('.vue') ? [p] : []
    })
}

const pl = load('pl')
const en = load('en')

function target(link: string, articles: Map<string, CompiledHelp>): string | null {
    const [slug, section] = link.split('#') as [string, string?]
    const article = articles.get(slug) ?? pl.get(slug)
    if (!article) return `no article "${slug}"`
    if (section && !article.headings.some((h) => h.id === section)) return `no section "#${section}" in "${slug}" (${article.headings.map((h) => h.id).join(', ')})`
    return null
}

describe('help content', () => {
    it('has every guide from the plan', () => {
        expect([...pl.keys()].sort()).toEqual(
            ['instalacja', 'komentarze', 'kopie-zapasowe', 'offline-prywatnosc', 'pdf', 'pierwsze-kroki', 'problemy', 'proba', 'slowniczek', 'statusy', 'synchronizacja', 'ustawienia', 'zadania'].sort(),
        )
    })

    it('"related" points at existing guides', () => {
        for (const [lang, articles] of [['pl', pl], ['en', en]] as const) {
            for (const [slug, a] of articles) for (const r of a.meta.related) expect(pl.has(r), `${lang}/${slug}: related "${r}"`).toBe(true)
        }
    })

    it('links inside the guides point at existing sections', () => {
        for (const [lang, articles] of [['pl', pl], ['en', en]] as const) {
            for (const [slug, a] of articles) {
                for (const m of a.html.matchAll(/href="\/pomoc\/([^"]+)"/g)) {
                    expect(target(m[1]!, articles), `${lang}/${slug}.md → /pomoc/${m[1]}`).toBeNull()
                }
                for (const m of a.html.matchAll(/href="#([^"]+)"/g)) {
                    expect(a.headings.some((h) => h.id === m[1]), `${lang}/${slug}.md → #${m[1]}`).toBe(true)
                }
            }
        }
    })

    it('every contextual "?" in the app points at an existing section', () => {
        const links: string[] = []
        for (const file of vueFiles(join(ROOT, 'src'))) {
            for (const m of readFileSync(file, 'utf8').matchAll(/<HelpLink\b[^>]*?\sto="([^"]+)"/g)) {
                links.push(m[1]!)
                expect(target(m[1]!, pl), `${file.slice(ROOT.length + 1)}: <HelpLink to="${m[1]}">`).toBeNull()
            }
        }
        expect(links.length).toBeGreaterThanOrEqual(8)
        // welcome screen button
        expect(readFileSync(join(ROOT, 'src/views/AllAdvancementsView.vue'), 'utf8')).toContain("/pomoc/pierwsze-kroki")
    })

    it('translations keep the Polish section ids (so the same "?" links work in every language)', () => {
        for (const [slug, a] of en) {
            const source = pl.get(slug)
            expect(source, `en/${slug}.md has no Polish original`).toBeDefined()
            expect(a.headings.map((h) => h.id), `en/${slug}.md heading ids`).toEqual(source!.headings.map((h) => h.id))
            expect(a.meta.category).toBe(source!.meta.category)
        }
    })

    it('screenshots exist', () => {
        for (const [lang, articles] of [['pl', pl], ['en', en]] as const) {
            for (const [slug, a] of articles) {
                for (const img of a.images) expect(existsSync(resolve(dirname(join(HELP, lang, slug)), img)), `${lang}/${slug}.md: ${img} (npm run help:screens)`).toBe(true)
            }
        }
    })
})
