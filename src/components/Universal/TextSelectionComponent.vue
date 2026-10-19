<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

/**
 * Lets the user pick fragments of the rank idea: drag to select a range (mouse) or tap words
 * (touch). Emits the selected words grouped into contiguous fragments.
 */
const props = defineProps<{ text: string[]; originalText: string[] }>();

const emits = defineEmits<{
  (e: 'text-highlighted', payload: { text: string[]; reset: boolean }): void;
}>();

const selected = ref<Set<number>>(new Set());
const container = ref<HTMLElement | null>(null);
let suppressNextClick = false;

const hasSelection = computed(() => selected.value.size > 0);
const isNarrowed = computed(() => props.text.length !== props.originalText.length);

watch(() => props.text, () => {
  selected.value = new Set();
});

function toggle(indices: number[]) {
  const next = new Set(selected.value);
  for (const i of indices) {
    if (next.has(i)) next.delete(i);
    else next.add(i);
  }
  selected.value = next;
}

function onWordClick(index: number) {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  toggle([index]);
}

/** Mouse drag selection: every word touched by the range is toggled. */
function onSelectionEnd() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !selection.toString().trim()) return;
  const range = selection.getRangeAt(0);
  if (!container.value || !container.value.contains(range.commonAncestorContainer)) return;
  const indices: number[] = [];
  container.value.querySelectorAll<HTMLElement>('[data-word-index]').forEach((span) => {
    if (selection.containsNode(span, true)) indices.push(Number(span.dataset.wordIndex));
  });
  toggle(indices);
  selection.removeAllRanges();
  suppressNextClick = true;
  setTimeout(() => (suppressNextClick = false), 0);
}

function confirmSelection() {
  const groups: string[] = [];
  let current: string[] = [];
  props.text.forEach((word, i) => {
    if (selected.value.has(i)) {
      current.push(word.trim());
    } else if (current.length > 0) {
      groups.push(current.join(' '));
      current = [];
    }
  });
  if (current.length > 0) groups.push(current.join(' '));
  emits('text-highlighted', { text: groups.filter((g) => g.length > 0), reset: false });
  selected.value = new Set();
}

function clearSelection() {
  selected.value = new Set();
}

function resetSelection() {
  emits('text-highlighted', { text: props.text, reset: true });
  selected.value = new Set();
}
</script>

<template>
  <div class="snipped">
    <p class="snipped-hint">{{ t('advancement.task.ideaHint') }}</p>
    <div ref="container" class="snipped-text" @mouseup="onSelectionEnd">
      <span
          v-for="(word, index) in props.text"
          :key="`${word}-${index}`"
          class="snipped-word"
          :class="{ highlighted: selected.has(index) }"
          :data-word-index="index"
          @click="onWordClick(index)"
      >{{ word }}{{ index < props.text.length - 1 ? ' ' : '' }}</span>
    </div>

    <div class="snipped-buttons">
      <span v-if="hasSelection" class="snipped-count">{{ t('advancement.task.selectedCount', { n: selected.size }) }}</span>
      <ButtonComponent
          v-if="hasSelection"
          @click.stop="confirmSelection"
          :button-text="t('edit.save')"
          button-style="success"
      />
      <ButtonComponent
          v-if="hasSelection"
          @click.stop="clearSelection"
          :button-text="t('edit.cancel')"
          button-style="ghost"
      />
      <ButtonComponent
          v-if="!hasSelection && isNarrowed"
          @click.stop="resetSelection"
          :button-text="t('advancement.task.ideaReset')"
          button-style="warning"
      />
    </div>
  </div>
</template>

<style scoped>
.snipped {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 60px;
  font-family: 'Museo', sans-serif;
  font-size: 12px;
}

.snipped-hint {
  margin: 0 0 6px;
  font-size: 12px;
  opacity: 0.7;
}

.snipped-text {
  font-size: 1.1em;
  line-height: 1.7;
  user-select: text;
  cursor: text;
  @media (prefers-color-scheme: dark) {
    color: var(--background-color);
  }
  @media (prefers-color-scheme: light) {
    color: var(--primary-color);
  }
}

.snipped-word {
  margin: 0;
  padding: 0.1em 0.05em;
  border-radius: 3px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.snipped-word.highlighted {
  background-color: var(--accent-info);
  color: white;
  font-weight: 500;
}

.snipped-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.snipped-count {
  font-size: 13px;
  opacity: 0.8;
}

/* Touch: tap words instead of fighting with native text selection */
@media (pointer: coarse) {
  .snipped-text {
    user-select: none;
    -webkit-user-select: none;
    font-size: 1.25em;
    line-height: 1.9;
  }
  .snipped-word {
    padding: 0.2em 0.1em;
  }
}
</style>
