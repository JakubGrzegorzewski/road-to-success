import { reactive } from 'vue'
import * as Y from 'yjs'
import type { WebrtcProvider } from 'y-webrtc'
import { getDoc, isDocEmpty } from '@/scripts/store/doc'
import { destroyLocalDocument, storeReady } from '@/scripts/store/persistence'
import { getLocal, setLocal } from '@/scripts/store/localState'
import { getIceServers } from './iceServers'
import { clearRoom, generateRoom, loadRoom, roomShard, saveRoom, type RoomConfig } from './room'

/**
 * Peer-to-peer synchronisation (y-webrtc). The Worker on `/signal` only introduces peers to each
 * other (encrypted with the room key); document data flows directly between devices over
 * WebRTC (or through TURN, still end-to-end encrypted).
 */
export type SyncState = 'disabled' | 'unsupported' | 'offline' | 'connecting' | 'alone' | 'synced'

export interface PeerDevice {
    clientId: number;
    name: string;
}

export const syncStatus = reactive({
    state: 'disabled' as SyncState,
    room: null as RoomConfig | null,
    /** Other devices with an open WebRTC connection. */
    peers: 0,
    /** Names announced by other devices (Yjs awareness). */
    devices: [] as PeerDevice[],
    lastSyncedAt: null as number | null,
    deviceName: '',
})

let provider: WebrtcProvider | null = null
let tick: ReturnType<typeof setInterval> | null = null
let lastPersistedSyncAt = 0
let starting: Promise<void> | null = null
/** Incremented on every start/stop; a slow start that was superseded aborts itself. */
let generation = 0

export function isSyncSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.isSecureContext !== false &&
        !!globalThis.crypto?.subtle &&
        typeof RTCPeerConnection !== 'undefined'
    )
}

export function signalingUrl(shard: string): string {
    const override = import.meta.env.VITE_SIGNALING_URL
    if (override) return `${override}${override.includes('?') ? '&' : '?'}s=${shard}`
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${location.host}/signal?s=${shard}`
}

export function defaultDeviceName(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): string {
    if (/iPhone/.test(ua)) return 'iPhone'
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)) return 'iPad'
    if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Telefon z Androidem' : 'Tablet z Androidem'
    if (/Macintosh|Mac OS X/.test(ua)) return 'Mac'
    if (/Windows/.test(ua)) return 'Komputer z Windows'
    if (/Linux/.test(ua)) return 'Komputer z Linuksem'
    return 'Urządzenie'
}

function markSynced(now = Date.now()) {
    syncStatus.lastSyncedAt = now
    if (now - lastPersistedSyncAt > 10_000) {
        lastPersistedSyncAt = now
        void setLocal('lastSyncedAt', now)
    }
}

function refresh() {
    if (!provider) return
    const conns = provider.room ? [...provider.room.webrtcConns.values()] : []
    const connected = conns.filter((c) => c.connected)
    syncStatus.peers = connected.length
    const signaling = provider.signalingConns.some((c) => c.connected)
    if (typeof navigator !== 'undefined' && navigator.onLine === false) syncStatus.state = 'offline'
    else if (connected.some((c) => c.synced)) syncStatus.state = 'synced'
    else if (connected.length > 0) syncStatus.state = 'connecting'
    else syncStatus.state = signaling ? 'alone' : 'connecting'
}

function refreshDevices() {
    if (!provider) return
    const self = getDoc().clientID
    const devices: PeerDevice[] = []
    provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId === self) return
        const name = (state as { user?: { name?: unknown } }).user?.name
        devices.push({ clientId, name: typeof name === 'string' && name.trim() ? name.trim() : '?' })
    })
    syncStatus.devices = devices.sort((a, b) => a.name.localeCompare(b.name))
}

/** Reconnect stale signaling sockets right away when the device wakes up or goes online. */
function nudge() {
    if (!provider) return
    for (const conn of provider.signalingConns) {
        if (conn.connected && Date.now() - conn.lastMessageReceived > 20_000) conn.ws?.close()
        else if (!conn.connected && !conn.connecting) conn.connect()
    }
    refresh()
}

function onVisibility() {
    if (document.visibilityState === 'visible') nudge()
}

function onDocUpdate(_update: Uint8Array, origin: unknown) {
    if (!provider) return
    if (origin === provider.room) markSynced() // received from a peer
    else if (syncStatus.peers > 0) markSynced() // sent to connected peers
}

export async function startSync(cfg: RoomConfig): Promise<void> {
    await stopSync()
    const myGeneration = ++generation
    syncStatus.room = { room: cfg.room, key: cfg.key }
    if (!isSyncSupported()) {
        syncStatus.state = 'unsupported'
        return
    }
    syncStatus.state = 'connecting'
    const run = (async () => {
        await storeReady()
        const [{ WebrtcProvider }, iceServers, shard] = await Promise.all([import('y-webrtc'), getIceServers(), roomShard(cfg.room)])
        if (myGeneration !== generation) return // stopped or restarted meanwhile
        provider = new WebrtcProvider(cfg.room, getDoc(), {
            signaling: [signalingUrl(shard)],
            password: cfg.key,
            maxConns: 20,
            filterBcConns: true,
            peerOpts: { config: { iceServers } },
        })
        provider.awareness.setLocalStateField('user', { name: syncStatus.deviceName || defaultDeviceName() })
        provider.on('synced', ({ synced }: { synced: boolean }) => {
            if (synced) markSynced()
            refresh()
        })
        provider.on('peers', refresh)
        provider.on('status', refresh)
        provider.awareness.on('change', refreshDevices)
        getDoc().on('update', onDocUpdate)
        window.addEventListener('online', nudge)
        window.addEventListener('offline', refresh)
        document.addEventListener('visibilitychange', onVisibility)
        tick = setInterval(refresh, 2000)
        refresh()
    })()
    starting = run
    try {
        await run
    } catch (e) {
        // e.g. the sync code could not be loaded while offline: try again when back online
        console.warn('[sync] could not start', e)
        if (myGeneration === generation) {
            syncStatus.state = 'offline'
            window.addEventListener('online', () => {
                if (myGeneration === generation) void startSync(cfg)
            }, { once: true })
        }
    } finally {
        if (starting === run) starting = null
    }
}

export async function stopSync(): Promise<void> {
    generation++
    if (starting) await starting.catch(() => undefined)
    const p = provider
    provider = null
    if (tick) clearInterval(tick)
    tick = null
    syncStatus.peers = 0
    syncStatus.devices = []
    if (!p) return
    getDoc().off('update', onDocUpdate)
    if (typeof window !== 'undefined') {
        window.removeEventListener('online', nudge)
        window.removeEventListener('offline', refresh)
        document.removeEventListener('visibilitychange', onVisibility)
    }
    p.destroy()
    // the provider created this Awareness instance, so it owns its timer
    p.awareness.destroy()
    // y-webrtc releases the room name asynchronously (after the key promise settles)
    await p.key
    await Promise.resolve()
}

/** Called once at startup: restores this device's room (if any) and starts syncing. */
export async function initSync(): Promise<void> {
    syncStatus.deviceName = (await getLocal('deviceName')) ?? ''
    syncStatus.lastSyncedAt = (await getLocal('lastSyncedAt')) ?? null
    const room = await loadRoom()
    if (room) await startSync(room)
}

export async function createRoom(): Promise<RoomConfig> {
    const cfg = generateRoom()
    await saveRoom(cfg)
    await startSync(cfg)
    return cfg
}

export type JoinMode = 'merge' | 'replace'

/**
 * Joins a room. `merge` unions local data with the room's. `replace` starts from the room's data:
 * the local copy is saved as a backup, the local database is DELETED (not cleared record by
 * record — deletions would sync and remove the same records on other devices) and the page reloads.
 */
export async function joinRoom(cfg: RoomConfig, mode: JoinMode, reloadTo = '/synchronizacja'): Promise<'joined' | 'reloading'> {
    await storeReady()
    if (mode === 'replace' && !isDocEmpty()) {
        await setLocal('backupBeforeRoomJoin', { at: Date.now(), update: Y.encodeStateAsUpdate(getDoc()) })
        await saveRoom(cfg)
        await stopSync()
        await destroyLocalDocument()
        location.replace(reloadTo)
        return 'reloading'
    }
    await saveRoom(cfg)
    await startSync(cfg)
    return 'joined'
}

export async function leaveRoom(): Promise<void> {
    await stopSync()
    await clearRoom()
    syncStatus.room = null
    syncStatus.state = 'disabled'
}

/**
 * "Change room": new id and key. Devices that only know the old link lose access;
 * share the new link with the devices that should stay.
 */
export async function rotateRoom(): Promise<RoomConfig> {
    return createRoom()
}

export async function setDeviceName(name: string): Promise<void> {
    syncStatus.deviceName = name.trim()
    await setLocal('deviceName', syncStatus.deviceName)
    provider?.awareness.setLocalStateField('user', { name: syncStatus.deviceName || defaultDeviceName() })
}

export function isInRoom(cfg: RoomConfig): boolean {
    return syncStatus.room?.room === cfg.room && syncStatus.room?.key === cfg.key
}
