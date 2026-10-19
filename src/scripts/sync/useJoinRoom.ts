import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isDocEmpty } from '@/scripts/store/doc'
import { storeReady } from '@/scripts/store/persistence'
import { isInRoom, joinRoom, syncStatus, type JoinMode } from './syncService'
import type { RoomConfig } from './room'

/**
 * Join flow shared by the sync screen (pasted link) and /dolacz (opened link).
 * With data already on the device the user chooses "merge" or "start from the room's data".
 */
export function useJoinRoom() {
    const { t } = useI18n()
    const pendingJoin = ref<RoomConfig | null>(null)
    const joining = ref(false)
    const message = ref<string | null>(null)

    async function join(cfg: RoomConfig, mode: JoinMode): Promise<'joined' | 'reloading'> {
        joining.value = true
        try {
            const result = await joinRoom(cfg, mode)
            if (result === 'joined') message.value = t('sync.joined')
            return result
        } finally {
            joining.value = false
            pendingJoin.value = null
        }
    }

    async function requestJoin(cfg: RoomConfig): Promise<'already' | 'needs-choice' | 'joined' | 'reloading'> {
        if (isInRoom(cfg)) {
            message.value = t('sync.alreadyInRoom')
            return 'already'
        }
        await storeReady()
        if (!isDocEmpty()) {
            pendingJoin.value = cfg
            return 'needs-choice'
        }
        return join(cfg, 'merge')
    }

    /** True when this device already syncs with another room (joining moves it). */
    const inOtherRoom = (cfg: RoomConfig) => !!syncStatus.room && !isInRoom(cfg)

    return { pendingJoin, joining, message, requestJoin, join, inOtherRoom }
}
