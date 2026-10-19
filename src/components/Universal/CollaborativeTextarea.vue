<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type * as Y from 'yjs'
import { Task } from '@/scripts/database/Task'
import { LOCAL_ORIGIN } from '@/scripts/store/doc'
import { applyStringToYText, transformPosition } from '@/scripts/store/yText'

/**
 * Textarea bound to the task's shared Y.Text: every keystroke is applied as a minimal text
 * change, and changes from other devices are merged in while keeping the caret in place.
 */
const props = defineProps<{
  taskId: string
  placeholder?: string
  label?: string
}>()

const el = ref<HTMLTextAreaElement | null>(null)
let ytext: Y.Text | undefined
let composing = false

function autoGrow() {
  const area = el.value
  if (!area) return
  area.style.height = 'auto'
  area.style.height = `${Math.max(area.scrollHeight, 120)}px`
}

function onInput() {
  if (!el.value || composing) return
  if (ytext) applyStringToYText(ytext, el.value.value, LOCAL_ORIGIN)
  else void Task.setContent(props.taskId, el.value.value)
  autoGrow()
}

function onCompositionEnd() {
  composing = false
  onInput()
}

const observer = (event: Y.YTextEvent, transaction: Y.Transaction) => {
  const area = el.value
  if (!area || !ytext) return
  if (transaction.local && transaction.origin === LOCAL_ORIGIN && area.value === ytext.toString()) return
  if (composing) return
  const focused = document.activeElement === area
  const start = area.selectionStart
  const end = area.selectionEnd
  const delta = event.delta as Array<{ insert?: unknown; delete?: number; retain?: number }>
  area.value = ytext.toString()
  if (focused) area.setSelectionRange(transformPosition(start, delta), transformPosition(end, delta))
  autoGrow()
}

function bind() {
  ytext?.unobserve(observer)
  ytext = Task.contentText(props.taskId)
  if (el.value) el.value.value = ytext?.toString() ?? ''
  ytext?.observe(observer)
  void nextTick(autoGrow)
}

onMounted(bind)
watch(() => props.taskId, bind)
onBeforeUnmount(() => ytext?.unobserve(observer))
</script>

<template>
  <textarea
      ref="el"
      class="multiline-text-input"
      :placeholder="placeholder"
      :aria-label="label ?? placeholder"
      rows="5"
      @input="onInput"
      @compositionstart="composing = true"
      @compositionend="onCompositionEnd"
  />
</template>

<style scoped>
.multiline-text-input {
  display: block;
  resize: vertical;
  overflow: hidden;
  min-height: 120px;
  line-height: 1.5;
  border: 1px solid var(--border);
}

@media (pointer: coarse) {
  .multiline-text-input {
    font-size: 16px; /* avoids iOS zoom on focus */
  }
}
</style>
