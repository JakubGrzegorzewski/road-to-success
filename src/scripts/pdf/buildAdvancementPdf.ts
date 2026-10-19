import { Status } from '@/scripts/interfaces'
import type { AdvancementViewModel, CommentRow } from './advancementViewModel'

export type PdfLayout = 'table' | 'simple'

export interface PdfLabels {
    title: string;
    idea: string;
    mentee: string;
    mentor: string;
    requirements: string;
    requirement: string;
    tasks: string;
    task: string;
    status: string;
    ideaFragment: string;
    none: string;
    generatedOn: string;
    statuses: Record<Status, string>;
    /** Needed only when the view model includes comments. */
    comments?: CommentLabels;
}

export interface CommentLabels {
    /** Heading above a task's comments ("Uwagi"). */
    title: string;
    /** "Uwagi ogólne". */
    general: string;
    /** Appendix heading in the table layout ("Uwagi"). */
    appendix: string;
    resolved: string;
    mentor: string;
    mentee: string;
    /** "Zad. {n}" */
    taskRef: string;
    /** "Wym. {label}" */
    requirementRef: string;
    /** "Ogólne" */
    generalRef: string;
}

const DEFAULT_COMMENT_LABELS: CommentLabels = {
    title: 'Uwagi',
    general: 'Uwagi ogólne',
    appendix: 'Uwagi',
    resolved: 'załatwione',
    mentor: 'Opiekun',
    mentee: 'Podopieczny',
    taskRef: 'Zad. {n}',
    requirementRef: 'Wym. {label}',
    generalRef: 'Ogólne',
}

export interface PdfOptions {
    layout: PdfLayout;
    labels: PdfLabels;
    /** Use the rank's A4 page artwork as background. */
    background: boolean;
    locale?: string;
}

export interface PdfImages {
    icon?: string;
    background?: string;
}

// A4 in PDF points; the background artwork has a coloured band on the right (~7 %)
// and organisation logos at the bottom (~10 %), the margins keep text away from them.
const A4 = { width: 595.28, height: 841.89 }
const MARGINS_WITH_BACKGROUND: [number, number, number, number] = [48, 56, 72, 108]
const MARGINS_PLAIN: [number, number, number, number] = [48, 56, 48, 56]

type Content = Record<string, unknown> | string | Content[]

function ideaParagraph(vm: AdvancementViewModel): Content {
    return {
        text: vm.ideaSegments.map((s) =>
            s.highlighted ? { text: s.text, bold: true, decoration: 'underline', decorationColor: vm.rank.colorHex } : s.text,
        ),
        alignment: 'justify',
        lineHeight: 1.35,
        margin: [0, 4, 0, 0],
    }
}

function commentDate(iso: string, locale: string | undefined): string {
    const d = new Date(iso)
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString(locale ?? 'pl-PL', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
}

function commentBlock(c: CommentRow, labels: PdfLabels, locale: string | undefined): Content {
    const cl = labels.comments ?? DEFAULT_COMMENT_LABELS
    const role = c.role === 'mentor' ? cl.mentor : c.role === 'mentee' ? cl.mentee : ''
    const meta = [role, commentDate(c.date, locale), c.resolved ? cl.resolved : ''].filter(Boolean).join(' · ')
    return {
        stack: [
            { text: [{ text: c.author || labels.none, bold: true }, meta ? { text: ` · ${meta}`, color: '#6b7280' } : ''], fontSize: 8.5 },
            { text: c.content, margin: [0, 1, 0, 0], color: c.resolved ? '#4b5563' : '#111827' },
        ],
        margin: [0, 0, 0, 5],
    }
}

/** Comment groups with a reference label ("Ogólne", "Zad. 2", "Wym. 5"), in page order. */
export function commentEntries(vm: AdvancementViewModel, labels: PdfLabels, withTasks: boolean): { ref: string; rows: CommentRow[] }[] {
    if (!vm.includeComments) return []
    const cl = labels.comments ?? DEFAULT_COMMENT_LABELS
    return [
        { ref: cl.generalRef, rows: vm.generalComments },
        ...(withTasks ? vm.tasks.map((t) => ({ ref: cl.taskRef.replace('{n}', String(t.index)), rows: t.comments })) : []),
        ...vm.requirements.map((r) => ({ ref: cl.requirementRef.replace('{label}', r.label), rows: r.comments })),
    ].filter((e) => e.rows.length > 0)
}

function commentsAppendix(vm: AdvancementViewModel, labels: PdfLabels, withTasks: boolean, locale: string | undefined): Content[] {
    const entries = commentEntries(vm, labels, withTasks)
    if (entries.length === 0) return []
    const cl = labels.comments ?? DEFAULT_COMMENT_LABELS
    return [
        {
            stack: [
                { text: cl.appendix, style: 'h2', margin: [0, 18, 0, 8] },
                {
                    table: {
                        headerRows: 0,
                        dontBreakRows: true,
                        widths: [62, '*'],
                        body: entries.map((e) => [{ text: e.ref, bold: true, fontSize: 9.5 }, { stack: e.rows.map((c) => commentBlock(c, labels, locale)) }]),
                    },
                    layout: {
                        hLineWidth: () => 0.6,
                        vLineWidth: () => 0,
                        hLineColor: () => '#cbd5e1',
                        paddingLeft: () => 4,
                        paddingRight: () => 4,
                        paddingTop: () => 5,
                        paddingBottom: () => 2,
                    },
                    fontSize: 9.5,
                },
            ],
        },
    ]
}

function requirementsTable(vm: AdvancementViewModel, labels: PdfLabels): Content {
    const body: Content[] = [
        [
            { text: labels.requirement, style: 'tableHeader' },
            { text: labels.tasks, style: 'tableHeader' },
        ],
    ]
    for (const r of vm.requirements) {
        body.push([
            { text: [{ text: `${r.label}. `, bold: true }, r.content] },
            r.tasks.length > 0
                ? { stack: r.tasks.map((t) => ({ text: t.content.trim() || labels.none, margin: [0, 0, 0, 4] })) }
                : { text: labels.none, color: '#94a3b8' },
        ])
    }
    return {
        table: { headerRows: 1, dontBreakRows: true, widths: ['40%', '60%'], body },
        layout: {
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => '#1f2937',
            vLineColor: () => '#1f2937',
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 5,
            paddingBottom: () => 5,
            fillColor: (row: number) => (row === 0 ? '#f1f5f9' : null),
        },
        fontSize: 9.5,
    }
}

function taskList(vm: AdvancementViewModel, labels: PdfLabels, locale?: string): Content[] {
    if (vm.tasks.length === 0) return [{ text: labels.none, color: '#94a3b8' }]
    const cl = labels.comments ?? DEFAULT_COMMENT_LABELS
    return vm.tasks.map((t) => ({
        unbreakable: t.content.length < 1200,
        margin: [0, 0, 0, 14],
        stack: [
            {
                columns: [
                    { text: `${labels.task} ${t.index}`, style: 'taskTitle', width: '*' },
                    { text: labels.statuses[t.status] ?? t.status, style: 'statusBadge', width: 'auto' },
                ],
            },
            { text: t.content.trim() || labels.none, margin: [0, 4, 0, 6], color: t.content.trim() ? '#111827' : '#94a3b8' },
            ...(t.ideaFragments.length > 0
                ? [
                      { text: labels.ideaFragment, style: 'label' },
                      { text: t.ideaFragments.join(' … '), italics: true, margin: [0, 2, 0, 6] },
                  ]
                : []),
            { text: labels.requirements, style: 'label' },
            t.requirements.length > 0
                ? { ul: t.requirements.map((r) => ({ text: [{ text: `${r.label}. `, bold: true }, r.content] })), margin: [0, 2, 0, 0], fontSize: 9.5 }
                : { text: labels.none, color: '#94a3b8' },
            ...(vm.includeComments && t.comments.length > 0
                ? [
                      { text: cl.title, style: 'label', margin: [0, 6, 0, 2] },
                      { stack: t.comments.map((c) => commentBlock(c, labels, locale)), margin: [8, 0, 0, 0], fontSize: 9.5 },
                  ]
                : []),
        ],
    }))
}

/** Pure: view model → pdfmake document definition. */
export function buildDocDefinition(vm: AdvancementViewModel, options: PdfOptions, images: PdfImages = {}): Record<string, unknown> {
    const { labels } = options
    const withBackground = options.background && !!images.background
    const margins = withBackground ? MARGINS_WITH_BACKGROUND : MARGINS_PLAIN
    const generated = vm.generatedAt.toLocaleDateString(options.locale ?? 'pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })
    const personLine = (label: string, name: string) => ({ text: [{ text: `${label}: `, bold: true }, name || labels.none], alignment: 'center', margin: [0, 2, 0, 0] })

    const content: Content[] = [
        ...(images.icon ? [{ image: 'icon', fit: [150, 190], alignment: 'center', margin: [0, 10, 0, 14] }] : []),
        { text: vm.rank.fullName, style: 'title', color: vm.rank.colorHex },
        personLine(labels.mentee, vm.menteeName),
        personLine(labels.mentor, vm.mentorName),
        { text: labels.idea, style: 'h2', margin: [0, 26, 0, 6] },
        ideaParagraph(vm),
        options.layout === 'table'
            ? { stack: [{ text: labels.requirements, style: 'h2' }, requirementsTable(vm, labels)], pageBreak: 'before' }
            : { stack: [{ text: labels.tasks, style: 'h2' }, ...taskList(vm, labels, options.locale)], pageBreak: 'before' },
        // table: every comment in an appendix; list: task comments sit under their task, the rest here
        ...commentsAppendix(vm, labels, options.layout === 'table', options.locale),
    ]

    return {
        pageSize: 'A4',
        pageMargins: margins,
        info: {
            title: `${labels.title} – ${vm.rank.fullName}${vm.menteeName ? ` – ${vm.menteeName}` : ''}`,
            author: vm.mentorName || undefined,
            subject: vm.rank.fullName,
            creator: 'Droga do sukcesu',
        },
        images: { ...(images.icon ? { icon: images.icon } : {}), ...(withBackground ? { background: images.background } : {}) },
        background: withBackground ? () => ({ image: 'background', width: A4.width, height: A4.height }) : undefined,
        header: (currentPage: number, pageCount: number) => ({
            columns: [
                { text: currentPage === 1 ? '' : `${vm.rank.fullName}${vm.menteeName ? ` · ${vm.menteeName}` : ''}`, width: '*' },
                { text: `${currentPage} / ${pageCount}`, width: 'auto' },
            ],
            margin: [margins[0], 22, margins[2], 0],
            fontSize: 8,
            color: '#6b7280',
        }),
        content: [...content, { text: `${labels.generatedOn}: ${generated}`, style: 'small', margin: [0, 18, 0, 0] }],
        defaultStyle: { font: 'Roboto', fontSize: 10.5, lineHeight: 1.2, color: '#111827' },
        styles: {
            title: { fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 8] },
            h2: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
            label: { fontSize: 9, bold: true, color: '#374151' },
            small: { fontSize: 8, color: '#6b7280' },
            tableHeader: { bold: true, fontSize: 10 },
            taskTitle: { fontSize: 11.5, bold: true },
            statusBadge: { fontSize: 8.5, bold: true, color: '#374151' },
        },
    }
}

// ---------------------------------------------------------------------------------------------

interface PdfMakeLike {
    createPdf(doc: object): { getBlob(cb?: (b: Blob) => void): Promise<Blob> | void };
    addVirtualFileSystem?(vfs: Record<string, string>): void;
    vfs?: Record<string, string>;
}

let pdfMakePromise: Promise<PdfMakeLike> | null = null

/** pdfmake (~1 MB) is loaded on first use only; works with pdfmake 0.2.x and 0.3.x. */
export function loadPdfMake(): Promise<PdfMakeLike> {
    pdfMakePromise ??= (async () => {
        const [pdfMakeModule, fontsModule] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')])
        const pdfMake = ((pdfMakeModule as { default?: unknown }).default ?? pdfMakeModule) as PdfMakeLike
        const fonts = ((fontsModule as { default?: unknown }).default ?? fontsModule) as Record<string, unknown>
        const vfs = ((fonts.pdfMake as { vfs?: unknown } | undefined)?.vfs ?? fonts.vfs ?? fonts) as Record<string, string>
        if (typeof pdfMake.addVirtualFileSystem === 'function') pdfMake.addVirtualFileSystem(vfs)
        else pdfMake.vfs = vfs
        return pdfMake
    })().catch((e) => {
        pdfMakePromise = null
        throw e
    })
    return pdfMakePromise
}

async function toDataUrl(url: string | undefined): Promise<string | undefined> {
    if (!url) return undefined
    if (url.startsWith('data:')) return url
    try {
        const blob = await (await fetch(url)).blob()
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
        })
    } catch {
        return undefined // image is optional
    }
}

function getBlob(doc: ReturnType<PdfMakeLike['createPdf']>): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            const result = doc.getBlob((blob) => resolve(blob)) // 0.2.x
            if (result && typeof (result as Promise<Blob>).then === 'function') (result as Promise<Blob>).then(resolve, reject) // 0.3.x
        } catch (e) {
            reject(e)
        }
    })
}

export async function buildAdvancementPdf(vm: AdvancementViewModel, options: PdfOptions, imageUrls: { icon?: string; background?: string }): Promise<Blob> {
    const [pdfMake, icon, background] = await Promise.all([
        loadPdfMake(),
        toDataUrl(imageUrls.icon),
        options.background ? toDataUrl(imageUrls.background) : Promise.resolve(undefined),
    ])
    return getBlob(pdfMake.createPdf(buildDocDefinition(vm, options, { icon, background })))
}

export function pdfFileName(vm: AdvancementViewModel): string {
    const slug = (s: string) =>
        s
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/ł/g, 'l')
            .replace(/Ł/g, 'L')
            .replace(/[^A-Za-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase()
    return [slug(vm.rank.fullName), slug(vm.menteeName)].filter(Boolean).join('-') + '.pdf'
}
