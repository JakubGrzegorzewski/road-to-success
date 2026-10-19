<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ButtonComponent from '@/components/Universal/ButtonComponent.vue'
import HelpLink from '@/components/Universal/HelpLink.vue'
import { exportBackup, shouldRemindAboutBackup, snoozeBackupReminder } from '@/scripts/export/backupActions'

/** Periodic reminder: when every device is lost, the data is gone — a file backup prevents that. */
const { t } = useI18n()
const route = useRoute()
const visible = ref(false)
const busy = ref(false)

async function check() {
  visible.value = (route.name === 'Home' || route.name === 'Sync') && (await shouldRemindAboutBackup())
}

async function exportNow() {
  busy.value = true
  try {
    const result = await exportBackup()
    if (result !== 'cancelled' && result !== 'needs-gesture') visible.value = false
  } finally {
    busy.value = false
  }
}

async function later() {
  await snoozeBackupReminder()
  visible.value = false
}

onMounted(check)
watch(() => route.name, check)
</script>

<template>
  <section v-if="visible" class="reminder" role="status">
    <div class="text">
      <strong>{{ t('backup.reminderTitle') }}</strong>
      <span>{{ t('backup.reminderMessage') }}</span>
    </div>
    <div class="actions">
      <ButtonComponent :button-text="t('backup.reminderAction')" button-style="primary" :disabled="busy" @click="exportNow" />
      <ButtonComponent :button-text="t('backup.reminderLater')" button-style="ghost" @click="later" />
      <HelpLink to="kopie-zapasowe#przypomnienie-o-kopii" class="reminder-help" />
    </div>
  </section>
</template>

<style scoped>
.reminder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin: var(--space-sm) auto 0;
  max-width: 960px;
  padding: var(--space-sm) var(--space-md);
  border-radius: 10px;
  background: var(--surface-raised);
  color: var(--text);
  border-left: 4px solid var(--accent-warning);
  box-shadow: 0 4px 14px var(--shadow-light);
  font-family: 'Museo', sans-serif;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  min-width: 0;
  flex: 1 1 280px;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.reminder-help {
  margin: 0 !important;
}

@media (max-width: 599px) {
  .reminder {
    margin: var(--space-sm);
  }
}
</style>
