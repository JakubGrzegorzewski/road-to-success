import { beforeEach, describe, expect, it } from 'vitest'
import { buildJoinLink, generateRoom, isValidRoom, parseJoinFragment, parseJoinInput, roomShard } from '@/scripts/sync/room'
import { __resetIceCache, getIceServers, PUBLIC_STUN } from '@/scripts/sync/iceServers'
import { defaultDeviceName } from '@/scripts/sync/syncService'

describe('sync room', () => {
    it('generates 128-bit room ids and 256-bit keys (base64url)', () => {
        const a = generateRoom()
        const b = generateRoom()
        expect(a.room).toMatch(/^[A-Za-z0-9_-]{22}$/)
        expect(a.key).toMatch(/^[A-Za-z0-9_-]{43}$/)
        expect(a.room).not.toBe(b.room)
        expect(isValidRoom(a)).toBe(true)
    })

    it('puts the secret only in the URL fragment', () => {
        const cfg = generateRoom()
        const link = buildJoinLink(cfg, 'https://example.org')
        const url = new URL(link)
        expect(url.pathname).toBe('/dolacz')
        expect(url.search).toBe('')
        expect(url.hash).toBe(`#r=${cfg.room}&k=${cfg.key}`)
        expect(parseJoinFragment(url.hash)).toEqual(cfg)
    })

    it('parses pasted links and rejects garbage', () => {
        const cfg = generateRoom()
        expect(parseJoinInput(`  ${buildJoinLink(cfg, 'https://x.y')}  `)).toEqual(cfg)
        expect(parseJoinInput(`r=${cfg.room}&k=${cfg.key}`)).toEqual(cfg)
        expect(parseJoinInput('https://x.y/dolacz#r=short&k=short')).toBeNull()
        expect(parseJoinInput('')).toBeNull()
        expect(parseJoinFragment(`#r=${cfg.room}`)).toBeNull()
    })

    it('derives a stable, non-reversible shard id', async () => {
        const s1 = await roomShard('abc')
        expect(s1).toBe(await roomShard('abc'))
        expect(s1).not.toBe(await roomShard('abd'))
        expect(s1).not.toContain('abc')
        expect(s1).toMatch(/^[A-Za-z0-9_-]{22}$/)
    })
})

describe('ICE servers', () => {
    beforeEach(() => __resetIceCache())

    const response = (body: unknown, init: { status?: number; type?: string } = {}) =>
        (async () =>
            new Response(JSON.stringify(body), {
                status: init.status ?? 200,
                headers: { 'content-type': init.type ?? 'application/json' },
            })) as unknown as typeof fetch

    it('adds TURN credentials from /api/turn and caches them for their lifetime', async () => {
        let calls = 0
        const fetcher = (async (...args: Parameters<typeof fetch>) => {
            calls++
            return response({ iceServers: [{ urls: ['turn:turn.example:3478?transport=udp'], username: 'u', credential: 'c' }, { urls: 'javascript:alert(1)' }], ttl: 600 })(...args)
        }) as typeof fetch
        const servers = await getIceServers(fetcher, 1_000)
        expect(servers).toEqual([...PUBLIC_STUN, { urls: ['turn:turn.example:3478?transport=udp'], username: 'u', credential: 'c' }])
        await getIceServers(fetcher, 2_000)
        expect(calls).toBe(1)
        await getIceServers(fetcher, 1_000 + 600_000)
        expect(calls).toBe(2)
    })

    it('falls back to public STUN when the Worker is not there', async () => {
        expect(await getIceServers(response('<!doctype html>', { type: 'text/html' }))).toEqual(PUBLIC_STUN)
        expect(await getIceServers(response({}, { status: 500 }))).toEqual(PUBLIC_STUN)
        expect(await getIceServers((async () => { throw new Error('offline') }) as typeof fetch)).toEqual(PUBLIC_STUN)
    })

    it('does not duplicate STUN when the provider returns its own', async () => {
        const servers = await getIceServers(response({ iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }, { urls: ['turns:turn.cloudflare.com:443?transport=tcp'], username: 'a', credential: 'b' }] }))
        expect(servers).toHaveLength(2)
    })
})

describe('device name', () => {
    it('guesses a friendly default', () => {
        expect(defaultDeviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('iPhone')
        expect(defaultDeviceName('Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile')).toBe('Telefon z Androidem')
        expect(defaultDeviceName('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Komputer z Windows')
    })
})
