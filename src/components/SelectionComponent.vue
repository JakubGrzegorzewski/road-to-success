<template>
    <div
      ref="textContainer"
      class="selection-component"
    >
      <div class="selection-component-text"
           @mouseup="handleTextSelection"
           @touchend="handleTextSelection"
      >
        <span
          v-for="(word, index) in words"
          :key="`${word}-${index}`"
          class="selection-component-word"
        >
          {{ word }}{{ index < words.length - 1 ? ' ' : '' }}
        </span>
      </div>

      <div class="selection-component-buttons">
        <div
            v-if="showActionButtons"
            class="selection-component-button confirm-button"
            @click.stop="confirmSelection"
        >
          <span class="info-icon">Zatwierdź zaznaczenie ✔</span>
        </div>
        <div
            class="selection-component-button clear-button"
            @click.stop="resetSelection"
        >
          <span class="info-icon">Wyczyść zaznaczenie ✘</span>
        </div>
      </div>

    </div>
</template>

<script setup>
  import { computed, ref, nextTick, onUnmounted } from 'vue'

  const props = defineProps({
    text: {
      type: String,
      required: true
    }
  })

  const emits = defineEmits(['text-highlighted'])

  const words = computed(() => props.text.split(' '))

  const showActionButtons = ref(false)
  const highlightedWords = ref([])
  const textContainer = ref(null)

  const clearHighlight = () => {
    highlightedWords.value.forEach(span => {
      span.classList.remove('highlighted')
    })
    highlightedWords.value = []
    showActionButtons.value = false
    window.getSelection().removeAllRanges()
    document.removeEventListener('click', handleContainerClick)
  }

  const handleContainerClick = async (event) => {
    await new Promise(resolve => setTimeout(resolve, 100))
    if (!event.target.closest('.selection-component-text') && !event.target.closest('.selection-component-buttons')) {
      clearHighlight()
    }
  }

  const handleTextSelection = async () => {
    await nextTick()
    const selection = window.getSelection()

    if (selection.rangeCount === 0 || selection.isCollapsed) {
      clearHighlight()
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()

    if (selectedText.length === 0) {
      clearHighlight()
      return
    }

    const container = textContainer.value
    if (!container.contains(range.commonAncestorContainer)) {
      return
    }

    const spans = container.querySelectorAll('.selection-component-word')
    spans.forEach(span => {
      if (selection.containsNode(span, true)) {
        highlightedWords.value.push(span)
        span.classList.add('highlighted')
        showActionButtons.value = true
      }
    })

    selection.removeAllRanges()
    document.addEventListener('click', handleContainerClick)

  }

  const confirmSelection = () => {
    const selectedText = highlightedWords.value.map(span => span.textContent.trim()).join(' ');
    emits('text-highlighted', {
      text: selectedText,
      reset: false
    })
    clearHighlight()
  }

  const resetSelection = () => {
    emits('text-highlighted', {
      text: props.text,
      reset: true
    })
    clearHighlight()
  }

  onUnmounted(() => {
    document.removeEventListener('click', handleContainerClick)
  })
</script>

<style scoped>
  .selection-component {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    user-select: text;
    cursor: text;
    padding: 12px;
    border-radius: 8px;
    background-color: #f5f5f5;
    min-height: 60px;
  }

  .selection-component-text {
    font-size: 1.1em;
    line-height: 1.6;
    color: #333;
    display: block;
    word-wrap: break-word;
  }

  .selection-component-word {
    margin: 0;
    padding: 0.1em 0.2em;
    display: inline;
  }

  .selection-component-word.highlighted {
    background-color: var(--accent-info);
    color: white;
    font-weight: 500;
  }

  .selection-component-word.selected {
    background-color: var(--accent-warning);
    color: white;
    font-weight: 500;
  }

  .selection-component-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .selection-component-button {
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .selection-component-button:hover {
    transform: scale(1.05);
  }

  .selection-component-button:active {
    transform: scale(0.95);
  }

  .info-icon {
    font-weight: bold;
    font-size: 1.1em;
  }

  .confirm-button{
    background-color: var(--accent-success);
  }

  .clear-button {
    background-color: var(--accent-error);
    right: 60px;
  }
</style>