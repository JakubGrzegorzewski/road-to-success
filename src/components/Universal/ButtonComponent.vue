<script setup lang="ts">
import {computed, ref, Ref} from "vue";
  const props = defineProps({
    buttonText: { type: String, required: false },
    buttonHint: { type: String, required: false },
    buttonIcon: { type: String, default: '', required: false },
    buttonStyle: { type: String, default: 'default' }
  })

  const resolvedImageSrc = computed(() => {
    if (props.buttonIcon) {
      return new URL(props.buttonIcon.replace('@', '../..'), import.meta.url).href
    }
    return ''
  })

const hintRef = ref<HTMLElement | null>(null) as Ref<HTMLElement | null>

const hintStyle = computed(() => {
  const height = hintRef.value?.getBoundingClientRect?.().height ?? 0
  const width = hintRef.value?.getBoundingClientRect?.().width ?? 0

  return { transform: `translate(+${width/2-40}px, -${height/2+30}px)` }
})
</script>

<template>
    <div :class="[buttonStyle, 'button']">
      <span v-if="buttonText"> {{ buttonText }} </span>
      <span v-if="buttonHint" :style="hintStyle" class="button-hint" ref="hintRef">{{ buttonHint }}</span>
      <img v-if="buttonIcon" :src="resolvedImageSrc" alt="Button Icon" style="width: 16px; height: 16px; object-fit: contain;">
    </div>
</template>

<style scoped>
  .button {
    border: none;
    border-radius: 10px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: 'Museo', sans-serif;
    width: fit-content;
  }

  .button:hover {
    transform: scale(1.05);
  }

  .button:active {
    transform: scale(0.95);
  }

  .default {
    background-color: var(--primary-color);
    color: white;
    font-weight: 500;
  }

  .default-light{
    background-color: var(--primary-color-light);
    color: white;
    font-weight: 500;
  }

  .primary {
    background-color: var(--secondary-color);
    color: white;
    font-weight: 500;
  }

  .success {
    background-color: var(--accent-success);
    color: white;
    font-weight: 500;
  }

  .warning {
    background-color: var(--accent-warning);
    color: white;
    font-weight: 500;
  }

  .error {
    background-color: var(--accent-error);
    color: white;
    font-weight: 500;
  }

  .info {
    background-color: var(--accent-info);
    color: white;
    font-weight: 500;
  }

  .white {
    background-color: white;
    color: var(--primary-color);
    font-weight: 700;
  }

  .button-hint {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    visibility: hidden;
    background-color: white;
    color: black;
    text-align: justify;
    padding: 5px;
    position: absolute;
    z-index: 1;
    border-radius: 4px;
    white-space: normal;
    font-family: 'Museo', sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    width: 300px;
  }
  .button:hover .button-hint {
    visibility: visible;
  }

</style>