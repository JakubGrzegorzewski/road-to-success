import { describe, expect, it } from 'vitest'
import { entriesForLanguage, highlight, normalizeText, searchHelp, type HelpIndexEntry } from '@/scripts/helpSearch'
import { polishPlural } from '@/scripts/i18n'

const entry = (slug: string, title: string, extra: Partial<HelpIndexEntry['meta']> = {}, text = '', headings: HelpIndexEntry['headings'] = []): HelpIndexEntry => ({
    meta: { slug, lang: 'pl', title, summary: '', category: 'dane', order: 0, keywords: [], related: [], ...extra },
    headings,
    text,
})

const entries = [
    entry('kopie-zapasowe', 'Kopie zapasowe', { keywords: ['backup', 'plik'] }, 'Źródło danych to plik .rts. Kod QR nie jest tu potrzebny.'),
    entry('synchronizacja', 'Synchronizacja', { keywords: ['qr', 'link'] }, 'Pokaż kod QR na drugim urządzeniu.', [{ id: 'link-i-kod-qr', text: 'Link i kod QR', level: 2 }]),
    entry('kod-qr', 'Kod QR w praktyce', {}, 'Coś o kodach.'),
]

describe('help search', () => {
    it('ignores Polish characters and case', () => {
        expect(normalizeText('Źródło ŁÓDŹ')).toBe('zrodlo lodz')
        expect(normalizeText('Źródło ŁÓDŹ')).toHaveLength('Źródło ŁÓDŹ'.length)
        expect(searchHelp(entries, 'zrodlo').map((r) => r.entry.meta.slug)).toEqual(['kopie-zapasowe'])
    })

    it('ranks title over keywords over text and requires every word', () => {
        expect(searchHelp(entries, 'qr').map((r) => r.entry.meta.slug)).toEqual(['kod-qr', 'synchronizacja', 'kopie-zapasowe'])
        expect(searchHelp(entries, 'kod drugim').map((r) => r.entry.meta.slug)).toEqual(['synchronizacja'])
        expect(searchHelp(entries, '   ')).toEqual([])
        expect(searchHelp(entries, 'nieistniejące')).toEqual([])
    })

    it('points at the matching section and highlights matches', () => {
        const [sync] = searchHelp(entries, 'kod qr').filter((r) => r.entry.meta.slug === 'synchronizacja')
        expect(sync!.heading?.id).toBe('link-i-kod-qr')
        expect(sync!.snippet.filter((p) => p.match).map((p) => p.text)).toEqual(['kod', 'QR'])
        expect(highlight('Źródło danych', ['zrodlo'])).toEqual([
            { text: 'Źródło', match: true },
            { text: ' danych', match: false },
        ])
    })

    it('uses the Polish article when a translation is missing', () => {
        const all = [entry('a', 'A po polsku'), entry('b', 'B po polsku'), { ...entry('a', 'A in English'), meta: { ...entry('a', 'A in English').meta, lang: 'en' } }]
        expect(entriesForLanguage(all, 'en').map((e) => [e.entry.meta.title, e.fallback])).toEqual([
            ['A in English', false],
            ['B po polsku', true],
        ])
        expect(entriesForLanguage(all, 'pl').every((e) => !e.fallback)).toBe(true)
    })
})

describe('Polish plural forms', () => {
    it('picks 1 / 2–4 / 5+ forms', () => {
        expect([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 0].map((n) => polishPlural(n, 3))).toEqual([0, 1, 1, 2, 2, 2, 2, 2, 1, 2, 2])
        expect([1, 2, 0].map((n) => polishPlural(n, 2))).toEqual([0, 1, 1])
    })
})
