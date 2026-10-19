<script setup lang="ts" generic="T">
import { ref, computed, onMounted, onBeforeUnmount, watch, useId } from 'vue';
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Option<V> {
  value: V;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<{
  label?: string,
  modelValue: T,
  options: Option<T>[],
  placeholder?: string,
  disabled?: boolean,
  styles?: string,
  backgroundColor?: string,
  /** Option labels are i18n keys. */
  translateLabels?: boolean,
  /** Stretch to the container width. */
  block?: boolean,
}>(), {
  translateLabels: false,
  block: false,
});

const emits = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'open'): void
  (e: 'close'): void
}>();

const id = useId()
const isOpen = ref(false);
const hoverIndex = ref(-1);
const rootEl = ref<HTMLElement | null>(null);
const triggerEl = ref<HTMLElement | null>(null);

const selectedOption = computed(() => props.options.find(o => o.value === props.modelValue));
const labelOf = (o: Option<T>) => (props.translateLabels ? t(o.label) : o.label)

function open() {
  if (props.disabled || isOpen.value) return;
  isOpen.value = true;
  hoverIndex.value = Math.max(0, props.options.findIndex(o => o.value === props.modelValue));
  emits('open');
}

function close() {
  if (!isOpen.value) return;
  isOpen.value = false;
  hoverIndex.value = -1;
  emits('close');
}

function toggle() {
  if (isOpen.value) close();
  else open();
}

function onSelect(option: Option<T>) {
  if (option.disabled) return;
  if (option.value !== props.modelValue) emits('update:modelValue', option.value);
  close();
  triggerEl.value?.focus();
}

function move(step: number) {
  const n = props.options.length;
  if (n === 0) return;
  let i = hoverIndex.value;
  for (let k = 0; k < n; k++) {
    i = (i + step + n) % n;
    if (!props.options[i]?.disabled) break;
  }
  hoverIndex.value = i;
}

function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (isOpen.value && props.options[hoverIndex.value]) onSelect(props.options[hoverIndex.value]!);
      else open();
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen.value) open(); else move(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!isOpen.value) open(); else move(-1);
      break;
    case 'Escape':
    case 'Tab':
      close();
      break;
  }
}

function handlePointerOutside(e: Event) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) close();
}

onMounted(() => document.addEventListener('pointerdown', handlePointerOutside));
onBeforeUnmount(() => document.removeEventListener('pointerdown', handlePointerOutside));

watch(() => props.modelValue, () => {
  if (isOpen.value) {
    const idx = props.options.findIndex(o => o.value === props.modelValue);
    if (idx !== -1) hoverIndex.value = idx;
  }
});
</script>

<template>
  <label v-if="label" class="dropdown-label" :id="`${id}-label`" @click="triggerEl?.focus()">{{ label }}</label>
  <div :style="props.styles" ref="rootEl" class="dropdown-root" :class="{ 'is-disabled': disabled, block }">
    <div
        ref="triggerEl"
        class="dropdown-trigger"
        :class="{ colored: !!backgroundColor }"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-controls="`${id}-list`"
        :aria-labelledby="label ? `${id}-label` : undefined"
        :tabindex="disabled ? -1 : 0"
        :style="backgroundColor ? { backgroundColor } : undefined"
        @click="toggle"
        @keydown="onKeydown"
    >
      <span class="dropdown-value" v-if="selectedOption">{{ labelOf(selectedOption) }}</span>
      <span class="dropdown-placeholder" v-else>{{ placeholder || '—' }}</span>
      <span class="dropdown-arrow" :class="{ 'open': isOpen }" aria-hidden="true">➤</span>
    </div>
    <transition name="dropdown-fade">
      <div v-show="isOpen" class="dropdown-popover">
        <ul class="dropdown-list" role="listbox" :id="`${id}-list`">
          <li
              v-for="(opt, i) in options"
              :key="String(opt.value)"
              :class="[
              'dropdown-item',
              { 'is-active': opt.value === modelValue,
                'is-hover': i === hoverIndex,
                'is-disabled': opt.disabled }
            ]"
              role="option"
              :aria-selected="opt.value === modelValue"
              :aria-disabled="opt.disabled || undefined"
              @mouseenter="!opt.disabled && (hoverIndex = i)"
              @click="onSelect(opt)"
          >
            <slot name="option" :option="opt" :active="opt.value === modelValue">
              {{ labelOf(opt) }}
            </slot>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dropdown-label {
  font-family: 'Museo', sans-serif;
}

.dropdown-root {
  position: relative;
  width: 240px;
  max-width: 100%;
  font-family: 'Museo', sans-serif;
}
.dropdown-root.block {
  width: 100%;
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
  min-height: 34px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

@media (prefers-color-scheme: dark) {
  .dropdown-trigger {
    background: var(--primary-color-light);
    color: var(--background-color);
  }
}
@media (prefers-color-scheme: light) {
  .dropdown-trigger {
    background: var(--background-color);
    color: var(--primary-color);
    box-shadow: inset 0 0 0 1px var(--border);
  }
}

/* status colours: always light text on the coloured background */
.dropdown-trigger.colored {
  color: white !important;
  box-shadow: none;
  font-weight: 500;
}

.dropdown-trigger:focus-visible {
  outline: 2px solid var(--secondary-color);
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
  transform: rotate(90deg);
  transition: transform 0.2s;
  font-size: 12px;
  margin-left: auto;
}
.dropdown-arrow.open {
  transform: rotate(270deg);
}

.dropdown-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 20;
  width: 100%;
  min-width: 180px;
  background: var(--background-color);
  border: 1px solid var(--background-color);
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
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
  max-height: min(280px, 50dvh);
  overflow-y: auto;
  overscroll-behavior: contain;
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
  color: var(--primary-color);
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
  .dropdown-item {
    color: var(--background-color);
  }
  .dropdown-item.is-hover:not(.is-disabled) {
    background: var(--primary-color-light);
  }
  .dropdown-item.is-active {
    background: var(--secondary-color);
  }
}

@media (pointer: coarse) {
  .dropdown-trigger {
    min-height: var(--touch-target);
    font-size: 16px;
  }
  .dropdown-item {
    min-height: var(--touch-target);
    font-size: 16px;
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
