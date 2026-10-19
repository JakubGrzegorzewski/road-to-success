import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { Marked, type Tokens } from 'marked'
import type { Plugin } from 'vite'
import { HELP_CATEGORIES, type HelpCategory, type HelpHeading, type HelpMeta } from '../src/scripts/helpSearch'

/**
 * Help articles (src/help/<lang>/<slug>.md) compiled to JS modules at build time, so the app needs
 * no Markdown library at runtime and the content is precached like any other chunk (offline).
 *
 *   import article from '@/help/pl/synchronizacja.md'        → { meta, headings, text, html }
 *   import index from '@/help/pl/synchronizacja.md?meta'     → { meta, headings, text } (no html)
 *
 * Extras: `> [!TIP]` / `> [!WARNING]` / `> [!NOTE]` callouts, `:::ios` / `:::android` / `:::desktop`
 * platform tabs, stable heading ids without Polish characters, images from src/help/img imported as
 * assets, links to other articles as `/pomoc/<slug>#<section>` (or `<slug>.md#<section>`), explicit
 * heading ids `## Title {#id}` (translations keep the Polish section ids, so "?" links work in every language).
 * Raw HTML in Markdown is dropped on purpose.
 */

export type { HelpCategory, HelpHeading, HelpMeta }

export interface CompiledHelp {
    meta: HelpMeta;
    headings: HelpHeading[];
    /** Plain text for search. */
    text: string;
    /** HTML with `__HELP_IMG_<n>__` placeholders for `images[n]`. */
    html: string;
    /** Image paths as written in the Markdown (relative to the article). */
    images: string[];
}

const LABELS: Record<string, Record<string, string>> = {
    pl: { TIP: 'Wskazówka', WARNING: 'Uwaga', NOTE: 'Dobrze wiedzieć', ios: 'iPhone i iPad', android: 'Android', desktop: 'Komputer' },
    en: { TIP: 'Tip', WARNING: 'Warning', NOTE: 'Good to know', ios: 'iPhone and iPad', android: 'Android', desktop: 'Computer' },
}

/** "Źródło – zażółć gęślą jaźń" → "zrodlo-zazolc-gesla-jazn" (URL fragment without Polish characters). */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ł/g, 'l')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

type FrontmatterValue = string | number | string[]

/** Minimal YAML frontmatter: `key: value`, `key: [a, b]`, numbers, quoted strings, `# comments`. */
export function parseFrontmatter(source: string): { data: Record<string, FrontmatterValue>; body: string } {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
    if (!match) return { data: {}, body: source }
    const data: Record<string, FrontmatterValue> = {}
    for (const rawLine of match[1]!.split(/\r?\n/)) {
        const line = rawLine.replace(/\s+#.*$/, '').trim()
        if (!line || line.startsWith('#')) continue
        const colon = line.indexOf(':')
        if (colon < 1) throw new Error(`frontmatter: cannot parse "${rawLine}"`)
        const key = line.slice(0, colon).trim()
        const value = line.slice(colon + 1).trim()
        if (value.startsWith('[')) {
            if (!value.endsWith(']')) throw new Error(`frontmatter: unterminated list for "${key}"`)
            data[key] = value
                .slice(1, -1)
                .split(',')
                .map((v) => unquote(v.trim()))
                .filter(Boolean)
        } else if (/^-?\d+(\.\d+)?$/.test(value)) {
            data[key] = Number(value)
        } else {
            data[key] = unquote(value)
        }
    }
    return { data, body: source.slice(match[0].length) }
}

function unquote(v: string): string {
    return /^(['"]).*\1$/.test(v) ? v.slice(1, -1) : v
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function htmlToText(html: string): string {
    return html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<\/?(strong|em|b|i|code|a|span|mark|del)\b[^>]*>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
}

/** `/pomoc/x#y`, `x.md#y`, `./x.md` → `/pomoc/x#y`; everything else unchanged. */
export function helpHref(href: string): string {
    const md = /^(?:\.\/)?([a-z0-9-]+)\.md(#[\w-]*)?$/.exec(href)
    if (md) return `/pomoc/${md[1]}${md[2] ?? ''}`
    return href
}

export function compileHelpMarkdown(source: string, file: string): CompiledHelp {
    const slug = basename(file).replace(/\.md$/, '')
    const lang = basename(dirname(file))
    const labels = LABELS[lang] ?? LABELS.pl!
    const { data, body } = parseFrontmatter(source)

    const required = ['title', 'summary', 'category'] as const
    for (const key of required) if (typeof data[key] !== 'string' || !data[key]) throw new Error(`${file}: frontmatter "${key}" is required`)
    if (!(HELP_CATEGORIES as readonly string[]).includes(String(data.category))) {
        throw new Error(`${file}: unknown category "${data.category}" (use ${HELP_CATEGORIES.join(', ')})`)
    }
    const list = (v: FrontmatterValue | undefined) => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [])
    const meta: HelpMeta = {
        slug,
        lang,
        title: String(data.title),
        summary: String(data.summary),
        category: data.category as HelpCategory,
        order: typeof data.order === 'number' ? data.order : 100,
        keywords: list(data.keywords),
        related: list(data.related),
    }

    const headings: HelpHeading[] = []
    const usedIds = new Map<string, number>()
    const images: string[] = []
    const blocks: string[] = []

    const marked = new Marked({ gfm: true, breaks: false })
    marked.use({
        renderer: {
            // raw HTML is never passed through (content is trusted, but keep it Markdown-only)
            html: () => '',
            heading(this: { parser: { parseInline(t: Tokens.Heading['tokens']): string } }, token: Tokens.Heading) {
                // `## Change room {#zmien-pokoj}`: explicit id (translations keep the Polish anchors)
                const explicit = /\s*\{#([a-z0-9-]+)\}\s*$/.exec(token.text)
                const inner = this.parser.parseInline(token.tokens).replace(/\s*\{#[a-z0-9-]+\}\s*$/, '')
                const plain = htmlToText(inner)
                let id = explicit?.[1] ?? (slugify(plain) || 'sekcja')
                const seen = usedIds.get(id) ?? 0
                usedIds.set(id, seen + 1)
                if (seen > 0) id = `${id}-${seen + 1}`
                if (token.depth >= 2 && token.depth <= 3) headings.push({ id, text: plain, level: token.depth })
                return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`
            },
            link(this: { parser: { parseInline(t: Tokens.Link['tokens']): string } }, token: Tokens.Link) {
                const href = helpHref(token.href)
                const inner = this.parser.parseInline(token.tokens)
                const external = /^https?:\/\//.test(href)
                const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
                return `<a href="${escapeHtml(href)}"${title}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inner}</a>`
            },
            image(token: Tokens.Image) {
                if (/^(https?:)?\/\//.test(token.href)) throw new Error(`${file}: external images are not allowed (${token.href}) – put the file in src/help/img`)
                const index = images.push(token.href) - 1
                const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
                return `<img src="__HELP_IMG_${index}__" alt="${escapeHtml(token.text)}"${title} loading="lazy" decoding="async">`
            },
        },
    })

    // Special blocks are rendered separately and substituted for placeholder paragraphs.
    const render = (md: string) => marked.parse(md, { async: false }) as string
    const lines = body.split(/\r?\n/)
    const out: string[] = []
    let tabGroup = 0
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        const callout = /^>\s*\[!(TIP|WARNING|NOTE)\]\s*$/.exec(line)
        if (callout) {
            const inner: string[] = []
            while (i + 1 < lines.length && /^>/.test(lines[i + 1]!)) inner.push(lines[++i]!.replace(/^>\s?/, ''))
            const kind = callout[1]!
            blocks.push(
                `<div class="help-callout help-callout-${kind.toLowerCase()}" role="note"><p class="help-callout-title">${labels[kind]}</p>${render(inner.join('\n'))}</div>`,
            )
            out.push('', `HELPBLOCK${blocks.length - 1}`, '')
            continue
        }
        const tab = /^:::(ios|android|desktop)\s*$/.exec(line)
        if (tab) {
            const panels: { platform: string; md: string }[] = []
            let j = i
            while (j < lines.length) {
                const open = /^:::(ios|android|desktop)\s*$/.exec(lines[j]!)
                if (!open) break
                const inner: string[] = []
                j++
                while (j < lines.length && lines[j]!.trim() !== ':::') inner.push(lines[j++]!)
                if (j >= lines.length) throw new Error(`${file}: unterminated :::${open[1]} block`)
                panels.push({ platform: open[1]!, md: inner.join('\n') })
                j++ // closing :::
                let k = j
                while (k < lines.length && lines[k]!.trim() === '') k++
                if (k < lines.length && /^:::(ios|android|desktop)\s*$/.test(lines[k]!)) j = k
                else break
            }
            i = j - 1
            const name = `${slug}-tabs-${++tabGroup}`
            const inputs = panels
                .map((p, n) => `<input type="radio" name="${name}" id="${name}-${p.platform}" value="${p.platform}"${n === 0 ? ' checked' : ''}><label for="${name}-${p.platform}">${labels[p.platform]}</label>`)
                .join('')
            const contents = panels.map((p) => `<div class="help-tab-panel" data-platform="${p.platform}">${render(p.md)}</div>`).join('')
            blocks.push(`<div class="help-tabs" data-count="${panels.length}">${inputs}${contents}</div>`)
            out.push('', `HELPBLOCK${blocks.length - 1}`, '')
            continue
        }
        out.push(line)
    }

    const html = render(out.join('\n')).replace(/<p>HELPBLOCK(\d+)<\/p>\n?/g, (_m, n: string) => blocks[Number(n)]!)
    return { meta, headings, text: htmlToText(html.replace(/__HELP_IMG_\d+__/g, '')), html, images }
}

/**
 * JS module source for a compiled article. With `metaOnly`, the HTML is left out (search index).
 * Images that do not exist (yet – see `npm run help:screens`) are left out instead of breaking the
 * build; tests/unit/help.test.ts reports them.
 */
export function helpModuleCode(compiled: CompiledHelp, file: string, metaOnly = false, imageExists: (path: string) => boolean = () => true): string {
    const head = `export const meta = ${JSON.stringify(compiled.meta)};\nexport const headings = ${JSON.stringify(compiled.headings)};\nexport const text = ${JSON.stringify(compiled.text)};\n`
    if (metaOnly) return `${head}export default { meta, headings, text };\n`
    const dir = dirname(file)
    const paths = compiled.images.map((src) => resolve(dir, src).split('\\').join('/'))
    const exists = paths.map((path) => imageExists(path))
    const imports = paths.map((path, i) => (exists[i] ? `import __helpImg${i} from ${JSON.stringify(path)};` : '')).filter(Boolean).join('\n')
    const withoutMissing = compiled.html.replace(/<img src="__HELP_IMG_(\d+)__"[^>]*>/g, (tag, n: string) => (exists[Number(n)] ? tag : ''))
    const html = JSON.stringify(withoutMissing).replace(/__HELP_IMG_(\d+)__/g, (_m, n: string) => `" + __helpImg${n} + "`)
    return `${imports}\n${head}export const html = ${html};\nexport default { meta, headings, text, html };\n`
}

/** Vite plugin: `*.md` under src/help → modules described above. */
export default function helpMarkdown(options: { root?: string } = {}): Plugin {
    let helpDir = ''
    return {
        name: 'rts-help-markdown',
        enforce: 'pre',
        configResolved(config) {
            helpDir = join(options.root ?? config.root, 'src', 'help')
        },
        load(id) {
            const [file, query = ''] = id.split('?') as [string, string?]
            if (!file.endsWith('.md') || relative(helpDir, file).startsWith('..')) return null
            this.addWatchFile(file)
            const compiled = compileHelpMarkdown(readFileSync(file, 'utf8'), file)
            const imageExists = (path: string) => {
                if (existsSync(path)) return true
                this.warn(`${relative(helpDir, file)}: missing image ${path} (run \`npm run help:screens\`)`)
                return false
            }
            return { code: helpModuleCode(compiled, file, new URLSearchParams(query).has('meta'), imageExists), map: null }
        },
    }
}
