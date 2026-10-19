/**
 * Globally unique record ids (UUID v4). Replaces Dexie's `++id`, which collided between devices.
 * `crypto.randomUUID` needs a secure context (https/localhost); the fallback keeps the app usable
 * when opened over plain http on a LAN during development.
 */
export function newId(): string {
    const c = globalThis.crypto
    if (c && typeof c.randomUUID === 'function') return c.randomUUID()
    const bytes = new Uint8Array(16)
    if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes)
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
    bytes[6] = (bytes[6]! & 0x0f) | 0x40
    bytes[8] = (bytes[8]! & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function isId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= 64
}
