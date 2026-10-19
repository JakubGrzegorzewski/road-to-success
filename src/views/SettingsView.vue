<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as Y from 'yjs'
import ButtonComponent from '@/components/Universal/ButtonComponent.vue'
import DropDownSelectionComponent from '@/components/Universal/DropDownSelectionComponent.vue'
import ImportBackupComponent from '@/components/Universal/ImportBackupComponent.vue'
import PopupComponent from '@/components/Universal/PopupComponent.vue'
import HelpLink from '@/components/Universal/HelpLink.vue'
import type { IUser } from '@/scripts/interfaces'
import { User } from '@/scripts/database/User'
import { commentPrefs, loadCommentPrefs, setCommentAuthor } from '@/scripts/commentPrefs'
import { ITypesEnum } from '@/scripts/eventBus'
import { setLocale, type AppLocale } from '@/scripts/i18n'
import { appState } from '@/scripts/appState'
import { exportBackup, exportReadableJson } from '@/scripts/export/backupActions'
import { applyImport, encodeRtsFile, exportFileName } from '@/scripts/export/exportFile'
import { deliverFile } from '@/scripts/pdf/deliverPdf'
import { getLocal } from '@/scripts/store/localState'
import { requestPersistentStorage, storeReady } from '@/scripts/store/persistence'
import { formatDate, useDbUpdates } from '@/scripts/composables'

const { t, locale } = useI18n()
const version = __APP_VERSION__

const importer = ref<InstanceType<typeof ImportBackupComponent> | null>(null)
const lastExportAt = ref<number | null>(null)
const backupBeforeJoin = ref<{ at: number; update: Uint8Array } | null>(null)
const usage = ref<string>('')
const busy = ref(false)
const notice = ref<string | null>(null)
const people = ref<IUser[]>([])

/** "Piszę jako" — who this device writes comments as. */
const authorOptions = computed(() => [
  { value: '', label: t('advancement.comment.notChosen') },
  ...people.value.map((p) => ({ value: p.id, label: p.fullName })),
])
const commentAuthor = computed<string>({
  get: () => (people.value.some((p) => p.id === commentPrefs.authorId) ? commentPrefs.authorId : ''),
  set: (id) => void setCommentAuthor(id),
})

async function loadPeople() {
  people.value = await User.getAll()
}
useDbUpdates([ITypesEnum.EUser], loadPeople)

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (v) => setLocale(v),
})

const langOptions: { value: AppLocale; label: string }[] = [
  { value: 'pl', label: 'Polski' },
  { value: 'en', label: 'English' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function refresh() {
  await storeReady()
  await Promise.all([loadPeople(), loadCommentPrefs()])
  lastExportAt.value = (await getLocal('lastExportAt')) ?? null
  backupBeforeJoin.value = (await getLocal('backupBeforeRoomJoin')) ?? null
  try {
    const estimate = await navigator.storage?.estimate?.()
    if (estimate?.usage) usage.value = formatBytes(estimate.usage)
  } catch {
    /* unsupported */
  }
}

onMounted(refresh)

async function exportRts() {
  busy.value = true
  try {
    const result = await exportBackup()
    if (result !== 'cancelled' && result !== 'needs-gesture') notice.value = t('backup.exported')
    await refresh()
  } finally {
    busy.value = false
  }
}

async function exportJson() {
  busy.value = true
  try {
    await exportReadableJson()
  } finally {
    busy.value = false
  }
}

async function downloadBeforeJoin() {
  const backup = backupBeforeJoin.value
  if (!backup) return
  const doc = new Y.Doc()
  Y.applyUpdate(doc, backup.update)
  const bytes = encodeRtsFile(doc, new Date(backup.at))
  await deliverFile(new Blob([bytes as BlobPart], { type: 'application/octet-stream' }), exportFileName('rts', new Date(backup.at)))
}

async function restoreBeforeJoin() {
  if (!backupBeforeJoin.value) return
  await applyImport(backupBeforeJoin.value.update)
  notice.value = t('backup.imported')
}

async function askPersist() {
  await requestPersistentStorage()
}
</script>

<template>
  <div class="page">
    <h1>{{ t('settings.title') }}</h1>

    <section class="card">
      <h2>{{ t('settings.language') }}</h2>
      <DropDownSelectionComponent v-model="currentLocale" :options="langOptions" />
    </section>

    <section class="card">
      <h2 class="with-help">{{ t('settings.comments') }} <HelpLink to="ustawienia#pisze-jako" /></h2>
      <p class="muted">{{ t('settings.commentsText') }}</p>
      <DropDownSelectionComponent v-model="commentAuthor" :label="t('advancement.comment.writingAs') + ':'" :options="authorOptions" :block="true" />
    </section>

    <section class="card">
      <h2 class="with-help">{{ t('backup.title') }} <HelpLink to="kopie-zapasowe" /></h2>
      <p class="muted">{{ t('backup.description') }}</p>
      <p class="status">{{ lastExportAt ? t('backup.lastExport', { date: formatDate(lastExportAt, locale) }) : t('backup.neverExported') }}</p>
      <div class="actions">
        <ButtonComponent :button-text="t('backup.exportRts')" button-style="primary" :disabled="busy" @click="exportRts" />
        <ButtonComponent :button-text="t('backup.import')" :disabled="busy" @click="importer?.pick()" />
        <ButtonComponent :button-text="t('backup.exportJson')" button-style="ghost" :disabled="busy" @click="exportJson" />
      </div>
      <div v-if="backupBeforeJoin" class="before-join">
        <p>{{ t('backup.beforeJoin', { date: formatDate(backupBeforeJoin.at, locale) }) }}</p>
        <div class="actions">
          <ButtonComponent :button-text="t('backup.beforeJoinDownload')" button-style="ghost" @click="downloadBeforeJoin" />
          <ButtonComponent :button-text="t('backup.beforeJoinRestore')" button-style="ghost" @click="restoreBeforeJoin" />
        </div>
      </div>
    </section>

    <section class="card">
      <h2>{{ t('settings.storage') }}</h2>
      <p v-if="appState.storageMode === 'memory'" class="memory-note">{{ t('app.memoryOnly') }}</p>
      <p v-else-if="appState.storagePersisted">{{ t('settings.persisted') }}</p>
      <template v-else>
        <p class="muted">{{ t('settings.notPersisted') }}</p>
        <ButtonComponent :button-text="t('settings.requestPersist')" button-style="ghost" @click="askPersist" />
      </template>
      <p v-if="usage" class="muted small">{{ t('settings.usage', { size: usage }) }}</p>
    </section>

    <section class="card">
      <h2>{{ t('settings.privacy') }}</h2>
      <p class="muted">{{ t('settings.privacyText') }}</p>
      <p class="muted small">{{ t('settings.version') }}: {{ version }}</p>
    </section>

    <ImportBackupComponent ref="importer" @imported="refresh" />
    <PopupComponent v-if="notice" :title="notice" :option-two="{ text: t('edit.ok'), action: () => { notice = null } }" />
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-md);
  font-family: 'Museo', sans-serif;
}

h1 {
  margin: var(--space-md) 0;
}

h2 {
  font-size: 1.05rem;
  margin: 0 0 var(--space-xs);
}

.card {
  background: var(--surface-raised);
  color: var(--text);
  border-radius: 12px;
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: 0 4px 14px var(--shadow-light);
}

.card p {
  line-height: 1.5;
}

.with-help {
  display: flex;
  align-items: center;
  gap: 14px;
}

.muted {
  color: var(--text-muted);
}

.small {
  font-size: 13px;
}

.status {
  font-weight: 500;
}

.memory-note {
  color: var(--accent-error);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.before-join {
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border);
}

@media (max-width: 599px) {
  .page {
    padding: var(--space-sm);
  }
  .card {
    padding: var(--space-sm) var(--space-sm) var(--space-md);
  }
  .actions :deep(.button) {
    flex: 1 1 100%;
  }
}
</style>
