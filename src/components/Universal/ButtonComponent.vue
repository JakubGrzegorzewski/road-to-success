<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  buttonText?: string;
  buttonHint?: string;
  buttonIcon?: string;
  buttonStyle?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  /** Full width on phones. */
  block?: boolean;
}>(), {
  buttonStyle: 'default',
  type: 'button',
  disabled: false,
  block: false,
});

const resolvedImageSrc = computed(() => {
  if (props.buttonIcon) {
    return new URL(props.buttonIcon.replace('@', '../..'), import.meta.url).href
  }
  return ''
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="[`btn--${buttonStyle}`, 'button', { block }]" :title="buttonHint">
    <img v-if="buttonIcon" :src="resolvedImageSrc" alt="" class="button-icon">
    <slot name="icon" />
    <span v-if="buttonText" class="button-text">{{ buttonText }}</span>
    <span v-if="buttonHint" class="button-hint" aria-hidden="true">{{ buttonHint }}</span>
  </button>
</template>

<style scoped>
  .button {
    position: relative;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    min-height: 36px;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: transform 0.2s ease, opacity 0.2s ease;
    white-space: nowrap;
    font-family: 'Museo', sans-serif;
    width: fit-content;
    max-width: 100%;
    color: white;
    font-weight: 500;
    -webkit-tap-highlight-color: transparent;
  }

  .button-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .button-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }

  /* no sticky hover zoom after a tap on touch screens */
  @media (hover: hover) {
    .button:hover:not(:disabled) {
      transform: scale(1.05);
    }
  }

  .button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .btn--default {
    background-color: var(--primary-color);
  }

  .btn--default-light {
    background-color: var(--primary-color-light);
  }

  .btn--primary {
    background-color: var(--secondary-color);
  }

  .btn--secondary {
    background-color: var(--primary-color-light);
  }

  .btn--success {
    background-color: var(--accent-success);
  }

  .btn--warning {
    background-color: var(--accent-warning);
  }

  .btn--error {
    background-color: var(--accent-error);
  }

  .btn--info {
    background-color: var(--accent-info);
  }

  .btn--white {
    background-color: white;
    color: var(--primary-color);
    font-weight: 700;
  }

  .btn--ghost {
    background: transparent;
    color: inherit;
    box-shadow: none;
    border: 1px solid var(--border);
  }

  .button-hint {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    visibility: hidden;
    opacity: 0;
    background-color: white;
    color: black;
    text-align: justify;
    padding: 5px;
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    border-radius: 4px;
    white-space: normal;
    font-family: 'Museo', sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    width: 300px;
    max-width: min(300px, 80vw);
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  @media (hover: hover) {
    .button:hover .button-hint,
    .button:focus-visible .button-hint {
      visibility: visible;
      opacity: 1;
    }
  }

  /* touch screens: comfortable targets (≥ 44 px) */
  @media (pointer: coarse) {
    .button {
      min-height: var(--touch-target);
      font-size: 14px;
      padding: 10px 16px;
    }
  }

  @media (max-width: 599px) {
    .button.block {
      width: 100%;
    }
  }
</style>
