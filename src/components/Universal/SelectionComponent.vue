<script setup lang="ts">
import { computed, ref, nextTick, onUnmounted, onMounted, type Ref } from 'vue'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const props = defineProps<{ text: string; originalText: string }>();

const emits = defineEmits<{
  (e: 'text-highlighted', payload: { text: string; reset: boolean }): void;
}>();

const words = computed<string[]>(() => props.text.split(' '));
const showAddSelection = ref<boolean>(false);
const showClearSelection = ref<boolean>(false);
const highlightedWords = ref<HTMLSpanElement[]>([]);
const textContainer = ref<HTMLElement | null>(null);

async function clearHighlight() {
  highlightedWords.value.forEach(span => span.classList.remove('highlighted'))
  highlightedWords.value = []
  showAddSelection.value = false
  window.getSelection()?.removeAllRanges()
  document.removeEventListener('click', handleOutsideClick)
  await nextTick()
  showClearSelection.value = props.text !== props.originalText
}

async function handleOutsideClick(event: MouseEvent) {
  await new Promise(resolve => setTimeout(resolve, 100))
  if (!(event.target as HTMLElement).closest('.snipped-text, .snipped-buttons')) {
    await clearHighlight()
  }
}

async function handleTextSelection() {
  await nextTick()
  const selection = window.getSelection()

  if (!selection || !selection.rangeCount || selection.isCollapsed || !selection.toString().trim()) {
    await clearHighlight()
    return
  }

  const range = selection.getRangeAt(0);
  const container = textContainer.value;
  if (!container || !container.contains(range.commonAncestorContainer)) return;

  // clear previous highlights to avoid duplicates
  highlightedWords.value.forEach(span => span.classList.remove('highlighted'));
  highlightedWords.value = [];

  const spans = container.querySelectorAll<HTMLSpanElement>('.snipped-word');
  spans.forEach((span) => {
    if (selection.containsNode(span, true)) {
      highlightedWords.value.push(span);
      span.classList.add('highlighted');
    }
  });

  if (highlightedWords.value.length > 0) {
    showAddSelection.value = true;
    showClearSelection.value = true;
    selection.removeAllRanges();
    document.addEventListener('click', handleOutsideClick);
  }
}

const confirmSelection = () => {
  const selectedText = highlightedWords.value.map(span => span.textContent?.trim()).join(' ')
  emits('text-highlighted', { text: selectedText, reset: false })
  clearHighlight()
}

const resetSelection = () => {
  emits('text-highlighted', { text: props.text, reset: true })
  clearHighlight()
}

onMounted(() => {
  showClearSelection.value = props.text !== props.originalText;
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
})
</script>

<template>
  <div ref="textContainer" class="snipped">
    <div class="snipped-text" @mouseup="handleTextSelection" @touchend="handleTextSelection">
      <span v-for="(word, index) in words" :key="`${word}-${index}`" class="snipped-word">
        {{ word }}{{ index < words.length - 1 ? ' ' : '' }}
      </span>
    </div>

    <div class="snipped-buttons">
      <button-component
          v-if="showAddSelection"
          @click.stop="confirmSelection"
          :button-text="$t('edit.save')"
          button-style="success"
      />
      <button-component
          v-if="showClearSelection"
          @click.stop="resetSelection"
          :button-text="$t('edit.cancel')"
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
  align-items: center;
  user-select: text;
  cursor: text;
  min-height: 60px;
  font-family: 'Museo', sans-serif;
  font-size: 12px;
}

.snipped-text {
  font-size: 1.1em;
  line-height: 1.6;
  color: #333;
  display: flex;
  justify-content: left;
  flex-wrap: wrap;
}

.snipped-word {
  margin: 0;
  padding: 0.1em 0.2em;
  display: inline;
}

.snipped-word.highlighted {
  background-color: var(--accent-info);
  color: white;
  font-weight: 500;
}

.snipped-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>
