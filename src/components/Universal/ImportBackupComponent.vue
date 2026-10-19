<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PopupComponent from '@/components/Universal/PopupComponent.vue'
import { applyImport, previewImport, RtsFileError, type ImportPreview } from '@/scripts/export/exportFile'
import { formatDate } from '@/scripts/composables'

/**
 * Import flow for .rts backups: pick a file → validate and preview on a scratch copy → merge.
 * Call `pick()` (exposed) from a click handler.
 */
const emit = defineEmits<{ (e: 'imported'): void }>()
const { t, locale } = useI18n()

const pending = ref<{ preview: ImportPreview; update: Uint8Array } | null>(null)
const error = ref<string | null>(null)
const done = ref(false)
const busy = ref(false)

function chooseFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    // no `accept`: iOS greys out unknown extensions such as .rts
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true })
    input.addEventListener('cancel', () => resolve(null), { once: true })
    input.click()
  })
}

async function load(file: File) {
  error.value = null
  try {
    pending.value = await previewImport(new Uint8Array(await file.arrayBuffer()))
  } catch (e) {
    const code = e instanceof RtsFileError ? e.code : 'unknown'
    error.value = t(`backup.errors.${code}`)
  }
}

async function pick() {
  const file = await chooseFile()
  if (file) await load(file)
}

async function confirm() {
  if (!pending.value) return
  busy.value = true
  try {
    await applyImport(pending.value.update)
    pending.value = null
    done.value = true
    emit('imported')
  } catch {
    error.value = t('backup.errors.corrupt')
  } finally {
    busy.value = false
  }
}

const summary = computed(() => {
  const p = pending.value?.preview
  if (!p) return ''
  return t('backup.importSummary', {
    date: formatDate(p.header.exportedAt, locale.value),
    people: p.incoming.people,
    advancements: p.incoming.ranksInProgress,
    tasks: p.incoming.tasks,
    afterPeople: p.after.people,
    afterAdvancements: p.after.ranksInProgress,
    afterTasks: p.after.tasks,
  })
})

defineExpose({ pick, load })
</script>

<template>
  <PopupComponent
      v-if="pending"
      :title="t('backup.importTitle')"
      :message="summary"
      :option-one="{ text: t('edit.cancel'), style: 'ghost', action: () => { pending = null } }"
      :option-two="{ text: t('backup.merge'), action: confirm, disabled: busy }"
      :dismiss="() => { pending = null }"
  />
  <PopupComponent
      v-if="error"
      :title="t('backup.import')"
      :message="error"
      :option-two="{ text: t('edit.ok'), action: () => { error = null } }"
  />
  <PopupComponent
      v-if="done"
      :title="t('backup.import')"
      :message="t('backup.imported')"
      :option-two="{ text: t('edit.ok'), action: () => { done = false } }"
  />
</template>
