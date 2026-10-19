import { DurableObject } from 'cloudflare:workers'
import { handleSignalMessage, LIMITS, messageSize, parseSignalMessage, PING, PONG, type HubBackend } from './signalHub'
import type { Env } from './index'

interface Attachment {
    /** Truncated hash of the client IP, only used for the per-IP connection limit. */
    ip: string;
    topics: string[];
}

function attachment(ws: WebSocket): Attachment {
    const a = ws.deserializeAttachment() as Partial<Attachment> | null
    return { ip: a?.ip ?? '', topics: Array.isArray(a?.topics) ? a.topics : [] }
}

async function hashIp(ip: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`rts-ip:${ip}`))
    return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * One instance per room shard. Uses the WebSocket Hibernation API, so idle rooms cost nothing;
 * pings are answered by the runtime without waking the object. Nothing is written to storage.
 */
export class SignalRoom extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env)
        ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG))
    }

    private backend(): HubBackend<WebSocket> {
        return {
            topicsOf: (ws) => attachment(ws).topics,
            setTopics: (ws, topics) => ws.serializeAttachment({ ...attachment(ws), topics } satisfies Attachment),
            connections: () => this.ctx.getWebSockets(),
            send: (ws, data) => {
                try {
                    ws.send(data)
                } catch {
                    /* socket already closing */
                }
            },
        }
    }

    async fetch(request: Request): Promise<Response> {
        if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
            return new Response('Expected a WebSocket upgrade', { status: 426 })
        }
        const sockets = this.ctx.getWebSockets()
        if (sockets.length >= LIMITS.maxConnectionsPerRoom) return new Response('Room is full', { status: 503 })
        const ip = await hashIp(request.headers.get('CF-Connecting-IP') ?? '')
        if (sockets.filter((ws) => attachment(ws).ip === ip).length >= LIMITS.maxConnectionsPerIp) {
            return new Response('Too many connections', { status: 429 })
        }
        const pair = new WebSocketPair()
        const client = pair[0]
        const server = pair[1]
        this.ctx.acceptWebSocket(server)
        server.serializeAttachment({ ip, topics: [] } satisfies Attachment)
        return new Response(null, { status: 101, webSocket: client })
    }

    async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
        if (messageSize(message) > LIMITS.maxMessageBytes) {
            ws.close(1009, 'Message too big')
            return
        }
        const msg = parseSignalMessage(message)
        if (msg) handleSignalMessage(this.backend(), ws, msg)
    }

    async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
        try {
            // complete the closing handshake (codes 1005/1006 cannot be sent back)
            ws.close(code === 1005 || code === 1006 ? 1000 : code, reason)
        } catch {
            /* already closed */
        }
    }

    async webSocketError(ws: WebSocket): Promise<void> {
        try {
            ws.close(1011, 'error')
        } catch {
            /* already closed */
        }
    }
}
