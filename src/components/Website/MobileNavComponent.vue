<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { syncStatus } from '@/scripts/sync/syncService'

/** Bottom navigation on phones (< 600 px). */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const tabs = [
  { value: 'home', to: '/', routes: ['Home', 'Advancement', 'AddPerson'] },
  { value: 'sync', to: '/synchronizacja', routes: ['Sync', 'JoinRoom'] },
  { value: 'settings', to: '/ustawienia', routes: ['Settings'] },
] as const

const active = computed(() => tabs.find((tab) => (tab.routes as readonly string[]).includes(String(route.name)))?.value ?? 'home')

function go(value: string) {
  const tab = tabs.find((x) => x.value === value)
  if (tab && route.path !== tab.to) void router.push(tab.to)
}
</script>

<template>
  <v-bottom-navigation
      :model-value="active"
      grow
      mandatory
      height="64"
      bg-color="#262F33"
      color="#6cc4f0"
      class="mobile-nav"
      :aria-label="t('app.name')"
      @update:model-value="go"
  >
    <v-btn value="home" :aria-current="active === 'home' ? 'page' : undefined">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM7 8h10M7 12h10M7 16h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <span>{{ t('nav.advancements') }}</span>
    </v-btn>
    <v-btn value="sync" :aria-current="active === 'sync' ? 'page' : undefined">
      <span class="icon-wrap">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-9a5 5 0 0 0-5 5M4 17h9a5 5 0 0 0 5-5M17 4l3 3-3 3M7 20l-3-3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="status-dot" :class="`state-${syncStatus.state}`" aria-hidden="true" />
      </span>
      <span>{{ t('nav.sync') }}</span>
    </v-btn>
    <v-btn value="settings" :aria-current="active === 'settings' ? 'page' : undefined">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4L10.6 6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.4 2.5h4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span>{{ t('nav.settings') }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<style scoped>
.mobile-nav {
  font-family: 'Museo', sans-serif;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.18) !important;
  /* keep the buttons above the iOS home indicator */
  padding-bottom: var(--safe-bottom);
  height: calc(64px + var(--safe-bottom)) !important;
}

.mobile-nav :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-size: 12px;
  min-width: 0;
  color: rgba(255, 255, 255, 0.78);
}

.mobile-nav :deep(.v-btn--active),
.mobile-nav :deep(.v-btn--selected) {
  color: #6cc4f0;
}

.mobile-nav svg {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}

.icon-wrap {
  position: relative;
  display: inline-flex;
}

.status-dot {
  position: absolute;
  top: -1px;
  right: -4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #262F33;
  background: transparent;
}

.status-dot.state-synced { background: var(--accent-success); }
.status-dot.state-alone { background: var(--accent-info); }
.status-dot.state-connecting { background: var(--accent-warning); }
.status-dot.state-offline,
.status-dot.state-unsupported { background: var(--accent-error); }
</style>
