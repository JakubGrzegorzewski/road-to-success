import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LIMITS, PING, PONG } from '../../worker/signalHub'
import type { Env } from '../../worker/index'

// --- minimal stand-ins for the Workers runtime -------------------------------------------
class FakeSocket {
    sent: string[] = []
    closed: [number, string] | null = null
    private attachment: unknown = null
    serializeAttachment(v: unknown) {
        this.attachment = structuredClone(v)
    }
    deserializeAttachment() {
        return this.attachment
    }
    send(d: string) {
        this.sent.push(d)
    }
    close(code: number, reason: string) {
        this.closed = [code, reason]
    }
}

class FakeState {
    sockets: FakeSocket[] = []
    autoResponse: unknown = null
    acceptWebSocket(ws: FakeSocket) {
        this.sockets.push(ws)
    }
    getWebSockets() {
        return [...this.sockets]
    }
    setWebSocketAutoResponse(pair: unknown) {
        this.autoResponse = pair
    }
}

const g = globalThis as Record<string, unknown>
const saved: Record<string, unknown> = {}

beforeEach(() => {
    for (const k of ['WebSocketRequestResponsePair', 'WebSocketPair', 'Response']) saved[k] = g[k]
    g.WebSocketRequestResponsePair = class {
        constructor(
            readonly request: string,
            readonly response: string,
        ) {}
    }
    g.WebSocketPair = class {
        0 = new FakeSocket()
        1 = new FakeSocket()
    }
    const RealResponse = saved.Response as typeof Response
    g.Response = class {
        status: number
        webSocket: unknown
        constructor(body: BodyInit | null, init: { status?: number; webSocket?: unknown } = {}) {
            this.status = init.status ?? 200
            this.webSocket = init.webSocket
            if (this.status !== 101) return new RealResponse(body, init) as unknown as this
        }
    }
})
afterEach(() => {
    for (const [k, v] of Object.entries(saved)) g[k] = v
})

async function makeRoom() {
    const { SignalRoom } = await import('../../worker/signal')
    const state = new FakeState()
    const room = new SignalRoom(state as unknown as DurableObjectState, {} as Env)
    return { room, state }
}

const upgrade = (ip = '1.2.3.4') =>
    new Request('https://app.example/signal?s=abcdefgh', { headers: { Upgrade: 'websocket', 'CF-Connecting-IP': ip } })

describe('SignalRoom Durable Object', () => {
    it('answers pings without waking up (auto response)', async () => {
        const { state } = await makeRoom()
        expect(state.autoResponse).toMatchObject({ request: PING, response: PONG })
    })

    it('accepts WebSocket upgrades and enforces connection limits', async () => {
        const { room, state } = await makeRoom()
        expect((await room.fetch(new Request('https://app.example/signal'))).status).toBe(426)

        const res = (await room.fetch(upgrade())) as unknown as { status: number; webSocket: unknown }
        expect(res.status).toBe(101)
        expect(res.webSocket).toBeInstanceOf(FakeSocket)
        expect(state.sockets).toHaveLength(1)
        expect(JSON.stringify(state.sockets[0]!.deserializeAttachment())).not.toContain('1.2.3.4') // IP is hashed

        for (let i = 1; i < LIMITS.maxConnectionsPerIp; i++) await room.fetch(upgrade())
        expect((await room.fetch(upgrade())).status).toBe(429)
        for (let i = state.sockets.length; i < LIMITS.maxConnectionsPerRoom; i++) await room.fetch(upgrade(`10.0.0.${i}`))
        expect((await room.fetch(upgrade('9.9.9.9'))).status).toBe(503)
    })

    it('relays signaling between sockets of the room and survives hibernation', async () => {
        const { room, state } = await makeRoom()
        await room.fetch(upgrade('1.1.1.1'))
        await room.fetch(upgrade('2.2.2.2'))
        const [a, b] = state.sockets as [FakeSocket, FakeSocket]
        await room.webSocketMessage(a as unknown as WebSocket, JSON.stringify({ type: 'subscribe', topics: ['t'] }))
        await room.webSocketMessage(b as unknown as WebSocket, JSON.stringify({ type: 'subscribe', topics: ['t'] }))

        // a new instance after hibernation only has the sockets and their attachments
        const { SignalRoom } = await import('../../worker/signal')
        const woken = new SignalRoom(state as unknown as DurableObjectState, {} as Env)
        await woken.webSocketMessage(a as unknown as WebSocket, JSON.stringify({ type: 'publish', topic: 't', data: 'enc' }))
        expect(b.sent.map((s) => JSON.parse(s))).toEqual([{ type: 'publish', topic: 't', data: 'enc', clients: 2 }])

        await woken.webSocketMessage(a as unknown as WebSocket, 'x'.repeat(LIMITS.maxMessageBytes + 1))
        expect(a.closed?.[0]).toBe(1009)
        await woken.webSocketClose(b as unknown as WebSocket, 1006, '')
        expect(b.closed).toEqual([1000, ''])
    })
})
