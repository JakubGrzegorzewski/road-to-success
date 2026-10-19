<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { syncStatus } from '@/scripts/sync/syncService'
import { useNow, useRelativeTime } from '@/scripts/composables'

/** "Zsynchronizowano z 1 urządzeniem · 2 min temu" / "Czeka na połączenie". */
const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { t } = useI18n()
const now = useNow(30_000)
const relative = useRelativeTime()

const label = computed(() => {
  const s = syncStatus.state
  if (s === 'synced') return t('sync.state.synced', { n: syncStatus.peers }, syncStatus.peers)
  return t(`sync.state.${s}`)
})

const detail = computed(() => {
  if (syncStatus.state === 'disabled' || !syncStatus.lastSyncedAt) return ''
  return t('sync.lastSynced', { time: relative(syncStatus.lastSyncedAt, now.value) })
})
</script>

<template>
  <router-link to="/synchronizacja" class="sync-chip" :class="[`state-${syncStatus.state}`, { compact: props.compact }]" :title="detail ? `${label} · ${detail}` : label">
    <span class="dot" aria-hidden="true" />
    <span class="text">
      <span class="label">{{ label }}</span>
      <span v-if="detail && !props.compact" class="detail"> · {{ detail }}</span>
    </span>
  </router-link>
</template>

<style scoped>
.sync-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  min-height: 32px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  font-family: 'Museo', sans-serif;
  font-size: 13px;
  white-space: nowrap;
}

.sync-chip:hover {
  background: rgba(255, 255, 255, 0.18);
}

.text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail {
  opacity: 0.75;
}

.dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9aa5ab;
}

.state-synced .dot { background: var(--accent-success); }
.state-alone .dot { background: var(--accent-info); }
.state-connecting .dot { background: var(--accent-warning); animation: pulse 1.4s ease-in-out infinite; }
.state-offline .dot,
.state-unsupported .dot { background: var(--accent-error); }

.compact {
  padding: 4px 10px;
  font-size: 12px;
}

@keyframes pulse {
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .state-connecting .dot { animation: none; }
}
</style>
