const PROD_API_URL = 'https://pdf-generator-962523277913.europe-west1.run.app';

const resolveApiBase = () => {
    const envOverride = import.meta.env.VITE_PDF_GENERATOR_URL;
    if (envOverride && envOverride.length > 0) {
        return envOverride;
    }

    return import.meta.env.DEV ? '/api' : PROD_API_URL;
};

const ensureTrailingPath = (url: string) => url.replace(/\/$/, '');

export function buildPdfApiUrl(path: string) {
    const base = ensureTrailingPath(resolveApiBase());
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
}

