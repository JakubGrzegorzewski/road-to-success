import { deleteLocal, getLocal, setLocal } from '@/scripts/store/localState'

/**
 * A sync room = random id (128 bit) + secret key (256 bit), both base64url.
 * The key never reaches any server: the join link carries it in the URL fragment
 * (`/dolacz#r=<room>&k=<key>`), which browsers do not send in requests.
 */
export interface RoomConfig {
    room: string;
    key: string;
}

const ROOM_RE = /^[A-Za-z0-9_-]{22}$/
const KEY_RE = /^[A-Za-z0-9_-]{43}$/
export const JOIN_PATH = '/dolacz'

export function base64url(bytes: Uint8Array): string {
    let bin = ''
    for (const b of bytes) bin += String.fromCharCode(b)
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBytes(n: number): Uint8Array {
    const bytes = new Uint8Array(n)
    globalThis.crypto.getRandomValues(bytes)
    return bytes
}

export function generateRoom(): RoomConfig {
    return { room: base64url(randomBytes(16)), key: base64url(randomBytes(32)) }
}

export function isValidRoom(cfg: Partial<RoomConfig> | null | undefined): cfg is RoomConfig {
    return !!cfg && typeof cfg.room === 'string' && typeof cfg.key === 'string' && ROOM_RE.test(cfg.room) && KEY_RE.test(cfg.key)
}

export function buildJoinLink(cfg: RoomConfig, origin: string = location.origin): string {
    return `${origin}${JOIN_PATH}#r=${cfg.room}&k=${cfg.key}`
}

/** Parses `#r=…&k=…` (with or without the leading '#'). */
export function parseJoinFragment(fragment: string): RoomConfig | null {
    const params = new URLSearchParams(fragment.replace(/^#/, ''))
    const cfg = { room: params.get('r') ?? '', key: params.get('k') ?? '' }
    return isValidRoom(cfg) ? cfg : null
}

/** Accepts a full join link, a fragment or the bare "r=…&k=…" text pasted by the user. */
export function parseJoinInput(input: string): RoomConfig | null {
    const text = input.trim()
    if (!text) return null
    const hashIndex = text.indexOf('#')
    return parseJoinFragment(hashIndex >= 0 ? text.slice(hashIndex + 1) : text)
}

/**
 * Shard id for the signaling server (one Durable Object per room). Derived with SHA-256 so the
 * room id itself does not appear in request URLs/logs.
 */
export async function roomShard(room: string): Promise<string> {
    const subtle = globalThis.crypto?.subtle
    if (!subtle) return 'default'
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(`road-to-success:${room}`))
    return base64url(new Uint8Array(digest)).slice(0, 22)
}

export async function loadRoom(): Promise<RoomConfig | null> {
    const stored = await getLocal('room')
    return stored && isValidRoom(stored) ? { room: stored.room, key: stored.key } : null
}

export async function saveRoom(cfg: RoomConfig): Promise<void> {
    await setLocal('room', { room: cfg.room, key: cfg.key, joinedAt: Date.now() })
}

export async function clearRoom(): Promise<void> {
    await deleteLocal('room')
}
