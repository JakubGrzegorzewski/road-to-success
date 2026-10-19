import { existsSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestHarness } from 'wrangler'

/**
 * Starts the Worker from wrangler.jsonc locally (workerd) and talks to /signal like y-webrtc does.
 * Requires `npm run build` first (static assets are served from ./dist).
 */
const harness = createTestHarness({ workers: [{ configPath: './wrangler.jsonc' }] })
let base: URL

function connect(shard: string, origin: string): Promise<{ ws: WebSocket; messages: unknown[]; next: () => Promise<unknown> }> {
    return new Promise((resolve, reject) => {
        const url = new URL(`/signal?s=${shard}`, base)
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
        // Node's WebSocket accepts headers through the second argument (undici)
        const ws = new WebSocket(url, { headers: { Origin: origin } } as unknown as string[])
        const messages: unknown[] = []
        const waiters: ((m: unknown) => void)[] = []
        ws.addEventListener('message', (e) => {
            const msg = JSON.parse(String(e.data))
            const waiter = waiters.shift()
            if (waiter) waiter(msg)
            else messages.push(msg)
        })
        ws.addEventListener('open', () =>
            resolve({
                ws,
                messages,
                next: () => (messages.length ? Promise.resolve(messages.shift()) : new Promise((r) => waiters.push(r))),
            }),
        )
        ws.addEventListener('error', () => reject(new Error('WebSocket failed')))
    })
}

describe('signaling Worker (wrangler local runtime)', () => {
    beforeAll(async () => {
        if (!existsSync('dist/index.html')) throw new Error('Run `npm run build` before the Worker integration test')
        base = (await harness.listen()).url
    })
    afterAll(async () => {
        await harness.close()
    })

    it('relays publish messages between two peers of the same room and answers pings', async () => {
        const origin = base.origin
        const a = await connect('integration-room-1', origin)
        const b = await connect('integration-room-1', origin)
        a.ws.send(JSON.stringify({ type: 'subscribe', topics: ['topic'] }))
        b.ws.send(JSON.stringify({ type: 'subscribe', topics: ['topic'] }))
        await new Promise((r) => setTimeout(r, 200))
        a.ws.send(JSON.stringify({ type: 'publish', topic: 'topic', data: 'encrypted-payload' }))
        expect(await b.next()).toEqual({ type: 'publish', topic: 'topic', data: 'encrypted-payload', clients: 2 })
        a.ws.send('{"type":"ping"}')
        // a receives its own publish first, then the pong
        expect(await a.next()).toMatchObject({ type: 'publish' })
        expect(await a.next()).toEqual({ type: 'pong' })
        a.ws.close()
        b.ws.close()
    })

    it('rejects foreign origins and plain requests', async () => {
        const res = await harness.fetch('/signal?s=integration-room-2', { headers: { Upgrade: 'websocket', Origin: 'https://evil.example' } })
        expect(res.status).toBe(403)
        const plain = await harness.fetch('/signal')
        expect(plain.status).toBe(426)
    })

    it('serves TURN configuration and the SPA', async () => {
        const turn = await harness.fetch('/api/turn', { headers: { 'Sec-Fetch-Site': 'same-origin' } })
        expect(turn.status).toBe(200)
        const body = (await turn.json()) as { iceServers: unknown[]; ttl: number }
        expect(Array.isArray(body.iceServers)).toBe(true)
        expect(body.ttl).toBeGreaterThan(0)
        const page = await harness.fetch('/stopien/some-id')
        expect(page.status).toBe(200)
        expect(await page.text()).toContain('<div id="app">')
    })
})
