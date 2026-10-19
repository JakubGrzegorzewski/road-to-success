import { describe, expect, it } from 'vitest'
import { createSignalHub, LIMITS, parseSignalMessage } from '../../worker/signalHub'

class FakeConn {
    sent: string[] = []
    closed: [number?, string?] | null = null
    send(data: string) {
        this.sent.push(data)
    }
    close(code?: number, reason?: string) {
        this.closed = [code, reason]
    }
    json() {
        return this.sent.map((s) => JSON.parse(s))
    }
}

describe('signal hub (y-webrtc protocol)', () => {
    it('validates messages', () => {
        expect(parseSignalMessage('not json')).toBeNull()
        expect(parseSignalMessage('{"type":"evil"}')).toBeNull()
        expect(parseSignalMessage('{"type":"publish"}')).toBeNull()
        expect(parseSignalMessage('{"type":"subscribe","topics":["a",1,""]}')).toEqual({ type: 'subscribe', topics: ['a'] })
        expect(parseSignalMessage('x'.repeat(LIMITS.maxMessageBytes + 1))).toBeNull()
        expect(parseSignalMessage(new TextEncoder().encode('{"type":"ping"}'))).toEqual({ type: 'ping' })
    })

    it('relays publish messages to subscribers only, with the client count', () => {
        const hub = createSignalHub<FakeConn>()
        const [a, b, c] = [new FakeConn(), new FakeConn(), new FakeConn()]
        for (const conn of [a, b, c]) hub.open(conn)
        hub.message(a, JSON.stringify({ type: 'subscribe', topics: ['room-1'] }))
        hub.message(b, JSON.stringify({ type: 'subscribe', topics: ['room-1'] }))
        hub.message(c, JSON.stringify({ type: 'subscribe', topics: ['room-2'] }))
        hub.message(a, JSON.stringify({ type: 'publish', topic: 'room-1', data: 'ENCRYPTED' }))
        expect(b.json()).toEqual([{ type: 'publish', topic: 'room-1', data: 'ENCRYPTED', clients: 2 }])
        expect(a.json()).toHaveLength(1) // y-webrtc expects its own messages back and ignores them
        expect(c.sent).toEqual([])

        // not a member → cannot publish
        hub.message(c, JSON.stringify({ type: 'publish', topic: 'room-1', data: 'spam' }))
        expect(b.sent).toHaveLength(1)

        hub.message(b, JSON.stringify({ type: 'unsubscribe', topics: ['room-1'] }))
        hub.message(a, JSON.stringify({ type: 'publish', topic: 'room-1', data: 'x' }))
        expect(b.sent).toHaveLength(1)

        hub.close(a)
        expect(hub.size()).toBe(2)
    })

    it('answers pings, limits topics and rejects huge frames', () => {
        const hub = createSignalHub<FakeConn>()
        const a = new FakeConn()
        hub.open(a)
        hub.message(a, '{"type":"ping"}')
        expect(a.json()).toEqual([{ type: 'pong' }])
        hub.message(a, JSON.stringify({ type: 'subscribe', topics: ['1', '2', '3', '4', '5', '6'] }))
        const b = new FakeConn()
        hub.open(b)
        hub.message(b, JSON.stringify({ type: 'subscribe', topics: ['5'] }))
        hub.message(b, JSON.stringify({ type: 'publish', topic: '5', data: 'x' }))
        expect(a.sent).toHaveLength(1) // 'a' never got topic 5 (limit = 4)
        hub.message(a, 'x'.repeat(LIMITS.maxMessageBytes + 10))
        expect(a.closed?.[0]).toBe(1009)
    })

    it('refuses connections above the room limit', () => {
        const hub = createSignalHub<FakeConn>()
        const conns = Array.from({ length: LIMITS.maxConnectionsPerRoom + 1 }, () => new FakeConn())
        const accepted = conns.map((c) => hub.open(c))
        expect(accepted.filter(Boolean)).toHaveLength(LIMITS.maxConnectionsPerRoom)
        expect(conns.at(-1)!.closed?.[0]).toBe(1013)
    })
})
