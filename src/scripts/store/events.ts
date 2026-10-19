import type * as Y from 'yjs'
import { eventBus, ITypesEnum } from '@/scripts/eventBus'
import type { DataMapName } from './doc'

const MAP_TO_TYPE: Record<DataMapName, ITypesEnum> = {
    people: ITypesEnum.EUser,
    ranksInProgress: ITypesEnum.ERankInProgress,
    tasks: ITypesEnum.ETask,
    comments: ITypesEnum.ETaskComment,
}

/**
 * Bridges Yjs changes to the app-wide `db-update` event.
 * The type is derived from the top-level map that changed (observeDeep), and bursts of
 * changes (typing, a sync batch, an import) are coalesced into one event per type.
 * Reads never emit anything.
 */
export function startEventBridge(doc: Y.Doc, delayMs = 50): () => void {
    const pending = new Set<ITypesEnum>()
    let timer: ReturnType<typeof setTimeout> | undefined

    const flush = () => {
        timer = undefined
        const types = [...pending]
        pending.clear()
        for (const type of types) eventBus.emit('db-update', { type })
    }

    const unsubscribers = (Object.keys(MAP_TO_TYPE) as DataMapName[]).map((name) => {
        const map = doc.getMap(name)
        const handler = () => {
            pending.add(MAP_TO_TYPE[name])
            if (timer === undefined) timer = setTimeout(flush, delayMs)
        }
        map.observeDeep(handler)
        return () => map.unobserveDeep(handler)
    })

    return () => {
        unsubscribers.forEach((u) => u())
        if (timer !== undefined) clearTimeout(timer)
        pending.clear()
    }
}
