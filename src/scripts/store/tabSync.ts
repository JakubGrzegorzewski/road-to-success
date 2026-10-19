import * as Y from 'yjs'

/**
 * Keeps several open tabs of the app on the same device in sync (BroadcastChannel).
 * Every tab persists its own updates to IndexedDB, so this only matters while tabs are open.
 */
const CHANNEL_NAME = 'road-to-success:doc'
const TAB_ORIGIN = 'tab-sync'

type TabMessage =
    | { type: 'update'; update: Uint8Array }
    | { type: 'hello'; stateVector: Uint8Array }
    | { type: 'state'; update: Uint8Array }
    | { type: 'reset' }

export interface TabSyncHandle {
    stop(): void;
    /** Tell other tabs that this device's document is about to be replaced. */
    broadcastReset(): void;
}

export function startTabSync(doc: Y.Doc, onReset: () => void): TabSyncHandle {
    if (typeof BroadcastChannel === 'undefined') return { stop() {}, broadcastReset() {} }
    const channel = new BroadcastChannel(CHANNEL_NAME)
    let stopped = false

    const post = (msg: TabMessage) => {
        if (!stopped) channel.postMessage(msg)
    }
    const onUpdate = (update: Uint8Array, origin: unknown) => {
        if (origin !== TAB_ORIGIN) post({ type: 'update', update })
    }

    channel.onmessage = (event: MessageEvent<TabMessage>) => {
        const msg = event.data
        if (!msg || typeof msg !== 'object') return
        try {
            switch (msg.type) {
                case 'update':
                case 'state':
                    if (msg.update instanceof Uint8Array) Y.applyUpdate(doc, msg.update, TAB_ORIGIN)
                    break
                case 'hello':
                    if (msg.stateVector instanceof Uint8Array) {
                        post({ type: 'state', update: Y.encodeStateAsUpdate(doc, msg.stateVector) })
                    }
                    break
                case 'reset':
                    stop()
                    onReset()
                    break
            }
        } catch (e) {
            console.warn('[tabSync] ignored message', e)
        }
    }

    doc.on('update', onUpdate)
    post({ type: 'hello', stateVector: Y.encodeStateVector(doc) })

    function stop() {
        if (stopped) return
        stopped = true
        doc.off('update', onUpdate)
        channel.close()
    }

    return {
        stop,
        broadcastReset() {
            post({ type: 'reset' })
        },
    }
}
