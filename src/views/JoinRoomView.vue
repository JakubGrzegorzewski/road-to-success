<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ButtonComponent from '@/components/Universal/ButtonComponent.vue'
import PopupComponent from '@/components/Universal/PopupComponent.vue'
import { parseJoinFragment } from '@/scripts/sync/room'
import { useJoinRoom } from '@/scripts/sync/useJoinRoom'

/**
 * Opened from a join link: /dolacz#r=<room>&k=<key>.
 * The fragment (with the key) is read once and immediately removed from the address bar/history.
 */
const { t } = useI18n()
const router = useRouter()
const { pendingJoin, joining, requestJoin, join, inOtherRoom } = useJoinRoom()
const invalid = ref(false)

async function finish() {
  await router.replace({ path: '/synchronizacja' })
}

onMounted(async () => {
  const cfg = parseJoinFragment(window.location.hash)
  history.replaceState(history.state, '', window.location.pathname)
  if (!cfg) {
    invalid.value = true
    return
  }
  const result = await requestJoin(cfg)
  if (result === 'joined' || result === 'already') await finish()
})

const mergeMessage = computed(() =>
    t('sync.mergeMessage') + (pendingJoin.value && inOtherRoom(pendingJoin.value) ? ' ' + t('sync.otherRoom') : ''),
)

function cancel() {
  pendingJoin.value = null
  void finish()
}

async function choose(mode: 'merge' | 'replace') {
  if (!pendingJoin.value) return
  const result = await join(pendingJoin.value, mode)
  if (result === 'joined') await finish()
}
</script>

<template>
  <div class="page">
    <p v-if="joining">{{ t('sync.joining') }}</p>
    <template v-else-if="invalid">
      <p>{{ t('sync.invalidLink') }}</p>
      <ButtonComponent :button-text="t('sync.title')" @click="finish" />
    </template>
    <p v-else>{{ t('sync.joining') }}</p>

    <PopupComponent
        v-if="pendingJoin"
        :title="t('sync.mergeTitle')"
        :message="mergeMessage"
        :option-three="{ text: t('edit.cancel'), style: 'ghost', action: cancel }"
        :option-one="{ text: t('sync.replace'), action: () => choose('replace'), disabled: joining }"
        :option-two="{ text: t('sync.merge'), action: () => choose('merge'), disabled: joining }"
        :dismiss="cancel"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 520px;
  margin: var(--space-lg) auto;
  padding: var(--space-md);
  text-align: center;
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}
</style>
