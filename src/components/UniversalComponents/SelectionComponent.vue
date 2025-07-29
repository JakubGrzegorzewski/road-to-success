<script setup>
import { computed, ref, nextTick, onUnmounted, onMounted } from 'vue'
import ButtonComponent from "@/components/UniversalComponents/ButtonComponent.vue";

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
  if (!event.target.closest('.snipped-text') && !event.target.closest('.snipped-buttons')) {
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

  const spans = container.querySelectorAll('.snipped-word')
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


<template>
    <div
      ref="textContainer"
      class="snipped"
    >
      <div class="snipped-text"
           @mouseup="handleTextSelection"
           @touchend="handleTextSelection"
      >
        <span
          v-for="(word, index) in words"
          :key="`${word}-${index}`"
          class="snipped-word"
        >
          {{ word }}{{ index < words.length - 1 ? ' ' : '' }}
        </span>
      </div>

      <div class="snipped-buttons">
        <button-component
            v-if="showAddSelection"
            @click.stop="confirmSelection"
            :button-text="$t('edit.save')"
            button-style='success'
        />
        <button-component
            v-if="showClearSelection"
            @click.stop="resetSelection"
            :button-text="$t('edit.cancel')"
            button-style='error'
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

  .snipped-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }


  .snipped-word.highlighted {
    background-color: var(--accent-info);
    color: white;
    font-weight: 500;
  }
</style>