/**
 * Signaling protocol of y-webrtc (same as its bin/server.js), transport-agnostic so the
 * Durable Object and local tools share one implementation.
 *
 *   { type: 'subscribe',   topics: string[] }
 *   { type: 'unsubscribe', topics: string[] }
 *   { type: 'publish',     topic: string, data: <encrypted by the clients> }  → sent to every subscriber, with `clients`
 *   { type: 'ping' }                                                           → { type: 'pong' }
 *
 * Messages are only relayed, never stored or logged. With a room password (always set by the app)
 * `data` is AES-GCM encrypted by the clients, so the server cannot read SDP offers or ICE candidates.
 */
export const LIMITS = {
    maxMessageBytes: 64 * 1024,
    maxTopicsPerConnection: 4,
    maxTopicLength: 128,
    maxConnectionsPerRoom: 32,
    maxConnectionsPerIp: 12,
} as const

export type SignalMessage =
    | { type: 'subscribe'; topics: string[] }
    | { type: 'unsubscribe'; topics: string[] }
    | { type: 'publish'; topic: string; [key: string]: unknown }
    | { type: 'ping' }

export const PING = '{"type":"ping"}'
export const PONG = '{"type":"pong"}'

const isTopic = (t: unknown): t is string => typeof t === 'string' && t.length > 0 && t.length <= LIMITS.maxTopicLength

/** Characters for strings, bytes for binary frames (y-webrtc only sends ASCII JSON). */
export function messageSize(raw: string | ArrayBuffer | ArrayBufferView): number {
    return typeof raw === 'string' ? raw.length : raw.byteLength
}

export function parseSignalMessage(raw: string | ArrayBuffer | ArrayBufferView): SignalMessage | null {
    if (messageSize(raw) > LIMITS.maxMessageBytes) return null
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
    let msg: unknown
    try {
        msg = JSON.parse(text)
    } catch {
        return null
    }
    if (!msg || typeof msg !== 'object') return null
    const m = msg as { type?: unknown; topics?: unknown; topic?: unknown }
    switch (m.type) {
        case 'subscribe':
        case 'unsubscribe':
            return Array.isArray(m.topics) ? { type: m.type, topics: m.topics.filter(isTopic) } : null
        case 'publish':
            return isTopic(m.topic) ? (msg as SignalMessage) : null
        case 'ping':
            return { type: 'ping' }
        default:
            return null
    }
}

/** What the hub needs from a transport (Durable Object hibernation API, ws server, tests…). */
export interface HubBackend<C> {
    topicsOf(conn: C): readonly string[];
    setTopics(conn: C, topics: string[]): void;
    connections(): Iterable<C>;
    send(conn: C, data: string): void;
}

export function handleSignalMessage<C>(backend: HubBackend<C>, conn: C, msg: SignalMessage): void {
    switch (msg.type) {
        case 'subscribe': {
            const topics = new Set(backend.topicsOf(conn))
            for (const t of msg.topics) if (topics.size < LIMITS.maxTopicsPerConnection) topics.add(t)
            backend.setTopics(conn, [...topics])
            break
        }
        case 'unsubscribe': {
            const remove = new Set(msg.topics)
            backend.setTopics(conn, backend.topicsOf(conn).filter((t) => !remove.has(t)))
            break
        }
        case 'publish': {
            // only members of a topic may publish to it
            if (!backend.topicsOf(conn).includes(msg.topic)) break
            const receivers: C[] = []
            for (const c of backend.connections()) if (backend.topicsOf(c).includes(msg.topic)) receivers.push(c)
            const out = JSON.stringify({ ...msg, clients: receivers.length })
            for (const r of receivers) backend.send(r, out)
            break
        }
        case 'ping':
            backend.send(conn, PONG)
            break
    }
}

export interface HubConnection {
    send(data: string): void;
    close(code?: number, reason?: string): void;
}

/** In-memory hub (used by tests and local tooling; production uses the Durable Object). */
export function createSignalHub<C extends HubConnection>() {
    const topics = new Map<C, string[]>()
    const backend: HubBackend<C> = {
        topicsOf: (c) => topics.get(c) ?? [],
        setTopics: (c, t) => {
            if (topics.has(c)) topics.set(c, t)
        },
        connections: () => topics.keys(),
        send: (c, data) => {
            try {
                c.send(data)
            } catch {
                /* closed */
            }
        },
    }
    return {
        open(conn: C): boolean {
            if (topics.size >= LIMITS.maxConnectionsPerRoom) {
                conn.close(1013, 'room full')
                return false
            }
            topics.set(conn, [])
            return true
        },
        message(conn: C, raw: string | ArrayBuffer | ArrayBufferView) {
            const msg = parseSignalMessage(raw)
            if (!msg) {
                if (messageSize(raw) > LIMITS.maxMessageBytes) conn.close(1009, 'message too big')
                return
            }
            handleSignalMessage(backend, conn, msg)
        },
        close(conn: C) {
            topics.delete(conn)
        },
        size: () => topics.size,
    }
}
