/**
 * Hands a generated file to the user in the way that works on the device:
 *   1. phone/tablet: the system share sheet (navigator.share with files) – "Save to Files", mail, …
 *   2. otherwise: a regular download (<a download>)
 *   3. iOS without file sharing: open the blob in a new tab (the PDF viewer has its own share button)
 */
export type DeliveryResult = 'shared' | 'downloaded' | 'opened' | 'cancelled' | 'needs-gesture'

export function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Touch-first devices get the share sheet by default. */
export function prefersShareSheet(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches
}

export function canShareFiles(file?: File): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false
    try {
        return navigator.canShare({ files: [file ?? new File([''], 'test.pdf', { type: 'application/pdf' })] })
    } catch {
        return false
    }
}

function revokeLater(url: string) {
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    revokeLater(url)
}

export function openBlobInNewTab(blob: Blob): boolean {
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    revokeLater(url)
    return win !== null
}

export interface DeliverOptions {
    title?: string;
    /** Force a method (buttons "Share"/"Download"); default: share sheet on touch devices. */
    prefer?: 'share' | 'download';
}

/**
 * Must be called from a user gesture for `navigator.share`; when the gesture has expired
 * (long generation) the result is 'needs-gesture' and the UI should offer a button.
 */
export async function deliverFile(blob: Blob, filename: string, options: DeliverOptions = {}): Promise<DeliveryResult> {
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
    const wantShare = options.prefer === 'share' || (options.prefer === undefined && (prefersShareSheet() || isIOS()))
    if (wantShare && canShareFiles(file)) {
        try {
            await navigator.share({ files: [file], title: options.title ?? filename })
            return 'shared'
        } catch (e) {
            const name = (e as { name?: string } | null)?.name
            if (name === 'AbortError') return 'cancelled'
            if (name === 'NotAllowedError') return 'needs-gesture'
            // anything else: fall through to a download
        }
    }
    if (isIOS() && !canShareFiles(file)) {
        return openBlobInNewTab(blob) ? 'opened' : 'needs-gesture'
    }
    downloadBlob(blob, filename)
    return 'downloaded'
}

export const deliverPdf = deliverFile
