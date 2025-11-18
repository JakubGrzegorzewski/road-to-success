<script setup lang="ts">
import {ref, computed, onMounted, onBeforeUnmount, watch, defineProps, defineEmits} from 'vue';

interface Option<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
}

const props = defineProps<{
  label?: string,
  modelValue: any,
  options: Option[],
  placeholder?: string,
  disabled?: boolean,
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'open'): void
  (e: 'close'): void
}>();

const isOpen = ref(false);
const hoverIndex = ref(-1);
const rootEl = ref<HTMLElement | null>(null);

const selectedOption = computed(() =>
    props.options.find(o => o.value === props.modelValue)
);

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  isOpen.value ? emits( 'open' ) : emits( 'close' );
}

function close() {
  if (isOpen.value) {
    isOpen.value = false;
    emits('close');
    hoverIndex.value = -1;
  }
}

function onSelect(option: Option) {
  if (option.disabled) return;
  emits('update:modelValue', option.value);
  close();
}

function onKey(e: KeyboardEvent) {
  if (props.disabled) return;
  if (!isOpen.value && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
    e.preventDefault();
    toggle();
    hoverIndex.value = 0;
    return;
  }
  if (!isOpen.value) return;

  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      close();
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveHover(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      moveHover(-1);
      break;
    case 'Home':
      e.preventDefault();
      setHover(0);
      break;
    case 'End':
      e.preventDefault();
      setHover(props.options.length - 1);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (hoverIndex.value >= 0 && hoverIndex.value < props.options.length) {
        const opt = props.options[hoverIndex.value];
        if (!opt.disabled) onSelect(opt);
      }
      break;
  }
}

function moveHover(delta: number) {
  if (props.options.length === 0) return;
  let idx = hoverIndex.value;
  do {
    idx = (idx + delta + props.options.length) % props.options.length;
  } while (props.options[idx].disabled);
  hoverIndex.value = idx;
  scrollIntoView(idx);
}

function setHover(idx: number) {
  if (idx < 0 || idx >= props.options.length) return;
  if (props.options[idx].disabled) return;
  hoverIndex.value = idx;
  scrollIntoView(idx);
}

function scrollIntoView(idx: number) {
  const list = rootEl.value?.querySelector('.dropdown-list');
  const item = list?.children[idx] as HTMLElement | undefined;
  if (item && list) {
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    if (itemTop < list.scrollTop) {
      list.scrollTop = itemTop;
    } else if (itemBottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = itemBottom - list.clientHeight;
    }
  }
}

function handleClickOutside(e: MouseEvent) {
  if (!rootEl.value) return;
  if (!rootEl.value.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', onKey);
});

watch(() => props.modelValue, () => {
  // Keep hover on selected if open
  if (isOpen.value) {
    const idx = props.options.findIndex(o => o.value === props.modelValue);
    if (idx !== -1) hoverIndex.value = idx;
  }
});

</script>

<template>
  <label v-if="label" class="dropdown-label">{{ label }}</label>
  <div ref="rootEl" class="dropdown-root" :class="{ 'is-disabled': disabled }">
    <div
        class="selector-style text-selection-component dropdown-trigger"
        :tabindex="disabled ? -1 : 0"
        @click="toggle"
        @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle"
    >
      <span class="dropdown-value" v-if="selectedOption">{{ selectedOption.label }}</span>
      <span class="dropdown-placeholder" v-else>{{ placeholder || 'Select...' }}</span>
      <span class="dropdown-arrow" :class="{ 'open': isOpen }">▾</span>
    </div>
    <transition name="dropdown-fade">
      <div v-show="isOpen" class="dropdown-popover">
        <ul class="dropdown-list" role="listbox">
          <li
              v-for="(opt, i) in options"
              :key="String(opt.value)"
              :class="[
              'dropdown-item',
              { 'is-active': opt.value === modelValue,
                'is-hover': i === hoverIndex,
                'is-disabled': opt.disabled }
            ]"
              :aria-selected="opt.value === modelValue"
              :tabindex="-1"
              @mouseenter="!opt.disabled && (hoverIndex = i)"
              @mouseleave="hoverIndex = -1"
              @click="onSelect(opt)"
          >
            <slot name="option" :option="opt" :active="opt.value === modelValue">
              {{ opt.label }}
            </slot>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dropdown-root {
  position: relative;
  width: 240px;
  font-family: 'Museo', sans-serif;
}
.dropdown-root.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.dropdown-trigger {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--background-color, #fff);
  border: 1px solid var(--background-color, #ccc);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
}
@media (prefers-color-scheme: dark) {
  .dropdown-trigger {
    background: var(--primary-color-light);
    border-color: var(--primary-color);
    color: var(--background-color);
  }
}

.dropdown-trigger:focus {
  outline: 2px solid var(--primary-color-light);
  outline-offset: 2px;
}

.dropdown-value {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dropdown-placeholder {
  flex: 1;
  color: #777;
}
@media (prefers-color-scheme: dark) {
  .dropdown-placeholder {
    color: #999;
  }
}

.dropdown-arrow {
  transition: transform 0.2s;
  font-size: 12px;
  margin-left: auto;
}
.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 20;
  width: 100%;
  background: var(--background-color);
  border: 1px solid var(--background-color);
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  max-height: 220px;
  overflow: hidden;
}
@media (prefers-color-scheme: dark) {
  .dropdown-popover {
    background: var(--primary-color);
    border-color: var(--primary-color-light);
  }
}

.dropdown-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.dropdown-item {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
  transition: background 0.15s, color 0.15s;
}
.dropdown-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.dropdown-item.is-hover:not(.is-disabled) {
  background: #f0f6ff;
}
.dropdown-item.is-active {
  font-weight: 600;
  background: #e3efff;
}
@media (prefers-color-scheme: dark) {
  .dropdown-item.is-hover:not(.is-disabled) {
    background: var(--secondary-color);
  }
  .dropdown-item.is-active {
    background: var(--secondary-color);
  }
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Scrollbar (WebKit) */
.dropdown-list::-webkit-scrollbar {
  width: 8px;
}
.dropdown-list::-webkit-scrollbar-track {
  background: transparent;
}
.dropdown-list::-webkit-scrollbar-thumb {
  background: #c4c4c4;
  border-radius: 4px;
}
@media (prefers-color-scheme: dark) {
  .dropdown-list::-webkit-scrollbar-thumb {
    background: var(--primary-color-light);
  }
}
</style>
