import { describe, expect, it } from 'vitest'
import { compileHelpMarkdown, helpHref, helpModuleCode, parseFrontmatter, slugify } from '../../vite/helpMarkdown'

const file = '/repo/src/help/pl/przyklad.md'
const fm = (extra = '') => `---\ntitle: Przykład\nsummary: Krótko.\ncategory: dane   # komentarz\norder: 5\nkeywords: [sync, "kod qr"]\nrelated: [kopie-zapasowe]\n${extra}---\n`

describe('help Markdown plugin', () => {
    it('reads the frontmatter', () => {
        const { data, body } = parseFrontmatter(fm() + 'Treść')
        expect(data).toEqual({ title: 'Przykład', summary: 'Krótko.', category: 'dane', order: 5, keywords: ['sync', 'kod qr'], related: ['kopie-zapasowe'] })
        expect(body).toBe('Treść')
        const { meta } = compileHelpMarkdown(fm() + 'x', file)
        expect(meta).toMatchObject({ slug: 'przyklad', lang: 'pl', category: 'dane', order: 5 })
        expect(() => compileHelpMarkdown('---\ntitle: X\n---\n', file)).toThrow('summary')
        expect(() => compileHelpMarkdown(fm().replace('dane', 'inne'), file)).toThrow('category')
    })

    it('gives headings stable ids without Polish characters', () => {
        expect(slugify('Źródło – zażółć gęślą jaźń!')).toBe('zrodlo-zazolc-gesla-jazn')
        const c = compileHelpMarkdown(fm() + '## Zmień pokój\n\n### Łączenie\n\n## Zmień pokój\n\n## Change room {#zmien-pokoj-en}\n', file)
        expect(c.headings).toEqual([
            { id: 'zmien-pokoj', text: 'Zmień pokój', level: 2 },
            { id: 'laczenie', text: 'Łączenie', level: 3 },
            { id: 'zmien-pokoj-2', text: 'Zmień pokój', level: 2 },
            { id: 'zmien-pokoj-en', text: 'Change room', level: 2 },
        ])
        expect(c.html).toContain('<h2 id="zmien-pokoj">Zmień pokój</h2>')
        expect(c.html).toContain('<h2 id="zmien-pokoj-en">Change room</h2>')
    })

    it('drops raw HTML', () => {
        const c = compileHelpMarkdown(fm() + 'Tekst <b>pogrubiony</b>.\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n', file)
        expect(c.html).not.toContain('<script')
        expect(c.html).not.toContain('<b>')
        expect(c.html).not.toContain('onerror')
        expect(c.html).toContain('pogrubiony')
    })

    it('renders callouts and platform tabs', () => {
        const c = compileHelpMarkdown(
            fm() + '> [!TIP]\n> Dobra **rada**.\n\n> [!WARNING]\n> Uważaj.\n\n:::ios\nNa iPhonie\n:::\n\n:::android\nNa Androidzie\n:::\n\nPo.\n',
            file,
        )
        expect(c.html).toContain('<div class="help-callout help-callout-tip" role="note"><p class="help-callout-title">Wskazówka</p><p>Dobra <strong>rada</strong>.</p>')
        expect(c.html).toContain('help-callout-warning')
        expect(c.html).toContain('<div class="help-tabs" data-count="2">')
        expect(c.html).toContain('value="ios" checked><label for="przyklad-tabs-1-ios">iPhone i iPad</label>')
        expect(c.html).toContain('<div class="help-tab-panel" data-platform="android"><p>Na Androidzie</p>')
        expect(c.html).toContain('<p>Po.</p>')
        expect(c.text).toContain('Dobra rada.')
        expect(() => compileHelpMarkdown(fm() + ':::ios\nbez końca\n', file)).toThrow('unterminated')
    })

    it('links articles and imports images as assets', () => {
        expect(helpHref('kopie-zapasowe.md#import')).toBe('/pomoc/kopie-zapasowe#import')
        expect(helpHref('/pomoc/pdf')).toBe('/pomoc/pdf')
        const c = compileHelpMarkdown(fm() + '[kopia](kopie-zapasowe.md#import), [strona](https://example.org)\n\n![Zrzut](../img/a.webp)\n\n![Brak](../img/b.webp)\n', file)
        expect(c.html).toContain('<a href="/pomoc/kopie-zapasowe#import">kopia</a>')
        expect(c.html).toContain('<a href="https://example.org" target="_blank" rel="noopener noreferrer">strona</a>')
        expect(c.images).toEqual(['../img/a.webp', '../img/b.webp'])
        const code = helpModuleCode(c, file, false, (p) => p.endsWith('a.webp'))
        expect(code).toContain('import __helpImg0 from "/repo/src/help/img/a.webp";')
        expect(code).toContain('<img src=\\"" + __helpImg0 + "\\" alt=\\"Zrzut\\"')
        expect(code).not.toContain('b.webp')
        const meta = helpModuleCode(c, file, true)
        expect(meta).not.toContain('export const html')
        expect(meta).toContain('export const text')
        expect(() => compileHelpMarkdown(fm() + '![x](https://example.org/a.png)', file)).toThrow('external')
    })
})
