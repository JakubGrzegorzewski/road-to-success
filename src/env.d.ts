/// <reference types="vite/client" />

declare global {
    interface ImportMetaEnv {
        readonly VITE_PDF_GENERATOR_URL?: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

