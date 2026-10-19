/**
 * ICE configuration for WebRTC: public STUN plus short-lived TURN credentials from `/api/turn`
 * (issued by the Worker; TURN relays encrypted traffic when a direct connection is impossible,
 * e.g. symmetric NAT on mobile networks).
 */
export const PUBLIC_STUN: RTCIceServer[] = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }]

interface TurnResponse {
    iceServers?: unknown;
    ttl?: unknown;
}

let cache: { servers: RTCIceServer[]; expiresAt: number } | null = null

function sanitize(input: unknown): RTCIceServer[] {
    if (!Array.isArray(input)) return []
    const out: RTCIceServer[] = []
    for (const s of input) {
        if (!s || typeof s !== 'object') continue
        const raw = (s as { urls?: unknown }).urls
        const urls = (Array.isArray(raw) ? raw : [raw]).filter((u): u is string => typeof u === 'string' && /^(stun|turns?):/.test(u))
        if (urls.length === 0) continue
        const server: RTCIceServer = { urls }
        const { username, credential } = s as { username?: unknown; credential?: unknown }
        if (typeof username === 'string') server.username = username
        if (typeof credential === 'string') server.credential = credential
        out.push(server)
    }
    return out
}

export async function getIceServers(fetchImpl: typeof fetch = (...a) => fetch(...a), now = Date.now()): Promise<RTCIceServer[]> {
    if (cache && cache.expiresAt - 60_000 > now) return cache.servers
    try {
        const res = await fetchImpl('/api/turn', { headers: { accept: 'application/json' }, cache: 'no-store' })
        if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) throw new Error(`HTTP ${res.status}`)
        const body = (await res.json()) as TurnResponse
        const fromServer = sanitize(body.iceServers)
        const hasStun = fromServer.some((s) => (s.urls as string[]).some((u) => u.startsWith('stun:')))
        const servers = hasStun ? fromServer : [...PUBLIC_STUN, ...fromServer]
        const ttl = typeof body.ttl === 'number' && body.ttl > 0 ? Math.min(body.ttl, 86_400) : 3_600
        cache = { servers, expiresAt: now + ttl * 1000 }
        return servers
    } catch {
        // no Worker (vite dev) or TURN not configured: direct connections still work in most networks
        return PUBLIC_STUN
    }
}

export function __resetIceCache(): void {
    cache = null
}
