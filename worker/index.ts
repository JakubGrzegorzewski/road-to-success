import { SignalRoom } from './signal'
import { createIceServers, type TurnEnv } from './turn'

export { SignalRoom }

export interface RateLimiter {
    limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * One Worker serves the whole app:
 *   /signal    WebSocket → Durable Object `SignalRoom` (peer introductions only, nothing stored)
 *   /api/turn  short-lived TURN credentials
 *   *          static SPA assets (handled by the assets binding before the Worker runs)
 */
export interface Env extends TurnEnv {
    ASSETS: Fetcher;
    SIGNAL: DurableObjectNamespace<SignalRoom>;
    /** Optional rate limiter binding (see wrangler.jsonc "ratelimits"). */
    RATE_LIMITER?: RateLimiter;
    /** Extra allowed origins for /signal and /api/turn, comma separated (e.g. http://localhost:5173 for vite dev). */
    ALLOWED_ORIGINS?: string;
}

const SECURITY_HEADERS = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS, ...headers },
    })
}

/**
 * Only our own pages may use the endpoints. Browsers always send Origin for WebSockets; for
 * same-origin GET fetches they send Sec-Fetch-Site instead.
 */
export function isAllowedRequest(request: Request, env: Pick<Env, 'ALLOWED_ORIGINS'>): boolean {
    const url = new URL(request.url)
    const allowed = new Set([url.origin, ...(env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)])
    const origin = request.headers.get('Origin')
    if (origin) return allowed.has(origin)
    return request.headers.get('Sec-Fetch-Site') === 'same-origin'
}

async function rateLimited(env: Env, request: Request, scope: string): Promise<boolean> {
    if (!env.RATE_LIMITER) return false
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const { success } = await env.RATE_LIMITER.limit({ key: `${scope}:${ip}` })
    return !success
}

async function handleSignal(request: Request, env: Env, url: URL): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected a WebSocket upgrade', { status: 426, headers: SECURITY_HEADERS })
    }
    if (!isAllowedRequest(request, env)) return new Response('Forbidden', { status: 403, headers: SECURITY_HEADERS })
    if (await rateLimited(env, request, 'signal')) return new Response('Too many requests', { status: 429, headers: SECURITY_HEADERS })
    const shard = url.searchParams.get('s') ?? ''
    const name = /^[A-Za-z0-9_-]{8,64}$/.test(shard) ? shard : 'default'
    return env.SIGNAL.get(env.SIGNAL.idFromName(name)).fetch(request)
}

async function handleTurn(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET' })
    if (!isAllowedRequest(request, env)) return json({ error: 'forbidden' }, 403)
    if (await rateLimited(env, request, 'turn')) return json({ error: 'rate_limited' }, 429)
    try {
        return json(await createIceServers(env))
    } catch {
        // TURN provider down: clients fall back to STUN
        return json({ iceServers: [], ttl: 300 })
    }
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url)
        if (url.pathname === '/signal') return handleSignal(request, env, url)
        if (url.pathname === '/api/turn') return handleTurn(request, env)
        if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404)
        return env.ASSETS.fetch(request)
    },
} satisfies ExportedHandler<Env>
