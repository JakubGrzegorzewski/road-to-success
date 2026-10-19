// Minimal typings for the browser builds we import directly (no @types packages needed).

declare module 'pdfmake/build/pdfmake' {
    export interface PdfDocument {
        /** pdfmake ≥ 0.3 returns a promise; 0.2 takes a callback. */
        getBlob(callback?: (blob: Blob) => void): Promise<Blob> | void;
    }
    export interface PdfMakeStatic {
        createPdf(docDefinition: object, options?: object): PdfDocument;
        addVirtualFileSystem?(vfs: Record<string, string>): void;
        vfs?: Record<string, string>;
        fonts?: Record<string, Record<string, string>>;
    }
    const pdfMake: PdfMakeStatic
    export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
    const vfs: Record<string, string> & { pdfMake?: { vfs: Record<string, string> }; vfs?: Record<string, string> }
    export default vfs
}

declare module 'qrcode' {
    export interface QRCodeToDataURLOptions {
        errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
        margin?: number;
        width?: number;
        scale?: number;
        color?: { dark?: string; light?: string };
    }
    export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
    export function toString(text: string, options?: QRCodeToDataURLOptions & { type?: 'svg' | 'utf8' | 'terminal' }): Promise<string>
    const QRCode: { toDataURL: typeof toDataURL; toString: typeof toString }
    export default QRCode
}
