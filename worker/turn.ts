/**
 * Short-lived TURN credentials for WebRTC. Two providers are supported (configure one):
 *
 *  - Cloudflare Realtime TURN: secrets TURN_KEY_ID + TURN_KEY_API_TOKEN
 *  - coturn (or any TURN server with the "REST API" shared secret, `use-auth-secret`):
 *    secret TURN_SHARED_SECRET + var TURN_URLS (comma separated, e.g. "turn:turn.example.org:3478,turns:turn.example.org:5349")
 *
 * Without configuration the endpoint returns an empty list and clients use public STUN only.
 */
export interface TurnEnv {
    TURN_KEY_ID?: string;
    TURN_KEY_API_TOKEN?: string;
    TURN_SHARED_SECRET?: string;
    TURN_URLS?: string;
    TURN_TTL?: string;
}

export interface IceServer {
    urls: string[];
    username?: string;
    credential?: string;
}

export const DEFAULT_TTL = 4 * 60 * 60

export function turnTtl(env: TurnEnv): number {
    const parsed = Number.parseInt(env.TURN_TTL ?? '', 10)
    return Math.min(86_400, Math.max(300, Number.isFinite(parsed) ? parsed : DEFAULT_TTL))
}

function normalize(input: unknown): IceServer | null {
    if (!input || typeof input !== 'object') return null
    const raw = (input as { urls?: unknown }).urls
    const urls = (Array.isArray(raw) ? raw : [raw])
        .filter((u): u is string => typeof u === 'string' && /^(stun|turns?):/.test(u))
        // port 53 is blocked by some browsers/networks and only slows ICE down
        .filter((u) => !/:53(\?|$)/.test(u))
    if (urls.length === 0) return null
    const { username, credential } = input as { username?: unknown; credential?: unknown }
    return {
        urls,
        ...(typeof username === 'string' ? { username } : {}),
        ...(typeof credential === 'string' ? { credential } : {}),
    }
}

export async function cloudflareIceServers(keyId: string, apiToken: string, ttl: number, fetchImpl: typeof fetch = fetch): Promise<IceServer[]> {
    const res = await fetchImpl(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl }),
    })
    if (!res.ok) throw new Error(`Cloudflare TURN API responded with HTTP ${res.status}`)
    const body = (await res.json()) as { iceServers?: unknown }
    const list = Array.isArray(body.iceServers) ? body.iceServers : body.iceServers ? [body.iceServers] : []
    return list.map(normalize).filter((s): s is IceServer => s !== null)
}

function toBase64(bytes: ArrayBuffer): string {
    let bin = ''
    for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b)
    return btoa(bin)
}

/** TURN REST API (draft-uberti-behave-turn-rest): username "<expiry>:<id>", password = base64(HMAC-SHA1(secret, username)). */
export async function sharedSecretIceServers(secret: string, urls: string, ttl: number, now = Date.now()): Promise<IceServer[]> {
    const list = urls
        .split(',')
        .map((u) => u.trim())
        .filter((u) => /^turns?:/.test(u))
    if (list.length === 0) return []
    const username = `${Math.floor(now / 1000) + ttl}:road-to-success`
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username))
    return [{ urls: list, username, credential: toBase64(signature) }]
}

export async function createIceServers(env: TurnEnv, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<{ iceServers: IceServer[]; ttl: number }> {
    const ttl = turnTtl(env)
    if (env.TURN_KEY_ID && env.TURN_KEY_API_TOKEN) {
        return { iceServers: await cloudflareIceServers(env.TURN_KEY_ID, env.TURN_KEY_API_TOKEN, ttl, fetchImpl), ttl }
    }
    if (env.TURN_SHARED_SECRET && env.TURN_URLS) {
        return { iceServers: await sharedSecretIceServers(env.TURN_SHARED_SECRET, env.TURN_URLS, ttl, now), ttl }
    }
    return { iceServers: [], ttl }
}
