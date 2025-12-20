<script setup lang="ts">
import {ref, nextTick, onUnmounted, onMounted} from 'vue'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const props = defineProps<{ text: string[]; originalText: string[] }>();

const emits = defineEmits<{
  (e: 'text-highlighted', payload: { text: string[]; reset: boolean }): void;
}>();

const showAddSelection = ref<boolean>(false);
const showClearSelection = ref<boolean>(false);
const textContainer = ref<HTMLElement | null>(null);

async function clearHighlight() {
  if (textContainer.value) {
    const highlightedEls = Array.from(textContainer.value.getElementsByClassName('highlighted'))
    highlightedEls.forEach((el) => el.classList.remove('highlighted'))
  }

  showAddSelection.value = false
  window.getSelection()?.removeAllRanges()
  document.removeEventListener('click', handleOutsideClick)
  await nextTick()
  showClearSelection.value = props.text !== props.originalText
}

async function handleOutsideClick(event: MouseEvent) {
  await new Promise(resolve => setTimeout(resolve, 100))
  if (!(event.target as HTMLElement).closest('.snipped-text, .snipped-buttons')) {
    showAddSelection.value = false
    document.removeEventListener('click', handleOutsideClick)
  }
}

async function handleTextSelection() {
  await nextTick()
  const selection = window.getSelection()

  if (!selection || !selection.rangeCount || selection.isCollapsed || !selection.toString().trim()) {
    showAddSelection.value = false
    selection?.removeAllRanges()
    document.removeEventListener('click', handleOutsideClick)
    return
  }

  const range = selection.getRangeAt(0);
  const container = textContainer.value;
  if (!container || !container.contains(range.commonAncestorContainer)) return;

  const spans = container.querySelectorAll<HTMLSpanElement>('.snipped-word');
  spans.forEach((span) => {
    if (selection.containsNode(span, true)) {
      if (!span.classList.contains('highlighted')) {
        span.classList.add('highlighted');
      }
    }
  });

  if (container.querySelectorAll<HTMLSpanElement>('.highlighted').length > 0) {
    showAddSelection.value = true;
    showClearSelection.value = props.text !== props.originalText;
    selection.removeAllRanges();
    document.addEventListener('click', handleOutsideClick);
  }
}

const confirmSelection = () => {
  if (!textContainer.value) return;
  let selectedText: string[] = [];
  let currentSpan : string = "";
  const spans = textContainer.value.querySelectorAll<HTMLSpanElement>('.snipped-word');
  spans.forEach((span) => {
    if (span.classList.contains('highlighted')) {
      currentSpan = currentSpan + " " + span.innerText.trim();
      console.log(currentSpan);
    }else{
      if(currentSpan.length > 0){
        selectedText.push(currentSpan);
      }
      currentSpan = "";
    }
  });
  console.log(selectedText);
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
      <span v-for="(word, index) in props.text" :key="`${word}-${index}`" class="snipped-word">
        {{ word }}{{ index < props.text.length - 1 ? ' ' : '' }}
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
  @media (prefers-color-scheme: dark) {
    color: var(--background-color);
  }
  @media (prefers-color-scheme: light) {
    color: var(--primary-color);
  }
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
