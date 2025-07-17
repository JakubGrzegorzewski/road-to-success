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
            v-if="showAddSelection"
            class="selection-component-button confirm-button"
            @click.stop="confirmSelection"
        >
          <span class="info-icon">Zatwierdź zaznaczenie ✔</span>
        </div>
        <div
            v-if="showClearSelection"
            class="selection-component-button clear-button"
            @click.stop="resetSelection"
        >
          <span class="info-icon">Wyczyść zaznaczenie ✘</span>
        </div>
      </div>

    </div>
</template>

<script setup>
  import { computed, ref, nextTick, onUnmounted, onMounted } from 'vue'

  const props = defineProps({
    text: {
      type: String,
      required: true
    },
    originalText: {
      type: String,
      required: true
    }
  })

  const emits = defineEmits(['text-highlighted'])

  const words = computed(() => props.text.split(' '))

  const showAddSelection = ref(false)
  const showClearSelection = ref(false)
  const highlightedWords = ref([])
  const textContainer = ref(null)

  const clearHighlight = async () => {
    highlightedWords.value.forEach(span => {
      span.classList.remove('highlighted')
    })
    highlightedWords.value = []
    showAddSelection.value = false
    window.getSelection().removeAllRanges()
    document.removeEventListener('click', handleContainerClick)
    await nextTick();
    showClearSelection.value = props.text !== props.originalText
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
        showAddSelection.value = true
        showClearSelection.value = true
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
    showClearSelection.value = props.text !== props.originalText
  }

  onUnmounted(() => {
    document.removeEventListener('click', handleContainerClick)
  })
  onMounted(() => {
    showClearSelection.value = props.text !== props.originalText
  })
</script>

<style scoped>
  .selection-component {
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

  .selection-component-text {
    font-size: 1.1em;
    line-height: 1.6;
    color: #333;
    display: flex;
    justify-content: left;
    flex-wrap: wrap;
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