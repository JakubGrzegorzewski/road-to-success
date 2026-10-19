import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { cloudflareIceServers, createIceServers, sharedSecretIceServers, turnTtl } from '../../worker/turn'
import { isAllowedRequest } from '../../worker/index'

const jsonFetch = (body: unknown, status = 200, calls: Request[] = []) =>
    (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(new Request(input, init))
        return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
    }) as typeof fetch

describe('TURN credentials', () => {
    it('clamps the TTL', () => {
        expect(turnTtl({})).toBe(14_400)
        expect(turnTtl({ TURN_TTL: '10' })).toBe(300)
        expect(turnTtl({ TURN_TTL: '999999' })).toBe(86_400)
        expect(turnTtl({ TURN_TTL: '3600' })).toBe(3_600)
    })

    it('creates coturn REST credentials (HMAC-SHA1 of "<expiry>:<id>")', async () => {
        const now = Date.UTC(2026, 9, 18)
        const [server] = await sharedSecretIceServers('s3cret', 'turn:t.example:3478, turns:t.example:5349, stun:x', 3600, now)
        expect(server!.urls).toEqual(['turn:t.example:3478', 'turns:t.example:5349'])
        expect(server!.username).toBe(`${now / 1000 + 3600}:road-to-success`)
        expect(server!.credential).toBe(createHmac('sha1', 's3cret').update(server!.username!).digest('base64'))
    })

    it('asks Cloudflare Realtime TURN and drops port 53 URLs', async () => {
        const calls: Request[] = []
        const servers = await cloudflareIceServers(
            'key-id',
            'token',
            600,
            jsonFetch(
                {
                    iceServers: [
                        { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
                        { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:turn.cloudflare.com:53?transport=udp'], username: 'u', credential: 'c' },
                    ],
                },
                200,
                calls,
            ),
        )
        expect(servers).toEqual([
            { urls: ['stun:stun.cloudflare.com:3478'] },
            { urls: ['turn:turn.cloudflare.com:3478?transport=udp'], username: 'u', credential: 'c' },
        ])
        expect(calls[0]!.url).toBe('https://rtc.live.cloudflare.com/v1/turn/keys/key-id/credentials/generate-ice-servers')
        expect(calls[0]!.headers.get('authorization')).toBe('Bearer token')
        expect(await calls[0]!.json()).toEqual({ ttl: 600 })
        await expect(cloudflareIceServers('k', 't', 600, jsonFetch({}, 401))).rejects.toThrow('401')
    })

    it('picks the configured provider', async () => {
        expect(await createIceServers({})).toEqual({ iceServers: [], ttl: 14_400 })
        const cf = await createIceServers({ TURN_KEY_ID: 'k', TURN_KEY_API_TOKEN: 't' }, jsonFetch({ iceServers: { urls: 'turns:x:443', username: 'a', credential: 'b' } }))
        expect(cf.iceServers).toEqual([{ urls: ['turns:x:443'], username: 'a', credential: 'b' }])
        const coturn = await createIceServers({ TURN_SHARED_SECRET: 's', TURN_URLS: 'turn:y:3478' })
        expect(coturn.iceServers[0]!.urls).toEqual(['turn:y:3478'])
    })
})

describe('endpoint access', () => {
    const req = (headers: Record<string, string>) => new Request('https://app.example/api/turn', { headers })
    it('allows only our own pages', () => {
        expect(isAllowedRequest(req({ Origin: 'https://app.example' }), {})).toBe(true)
        expect(isAllowedRequest(req({ Origin: 'https://evil.example' }), {})).toBe(false)
        expect(isAllowedRequest(req({ 'Sec-Fetch-Site': 'same-origin' }), {})).toBe(true)
        expect(isAllowedRequest(req({ 'Sec-Fetch-Site': 'cross-site' }), {})).toBe(false)
        expect(isAllowedRequest(req({}), {})).toBe(false)
        expect(isAllowedRequest(req({ Origin: 'http://localhost:5173' }), { ALLOWED_ORIGINS: 'http://localhost:5173' })).toBe(true)
    })
})
