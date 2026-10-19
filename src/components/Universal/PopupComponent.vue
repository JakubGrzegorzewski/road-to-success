<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

interface ModalOption {
  text: string;
  action: () => void;
  /** ButtonComponent style; default: 'default' (options one/three) / 'primary' (option two) */
  style?: string;
  disabled?: boolean;
}

const props = withDefaults(
    defineProps<{
      title: string;
      message?: string;
      optionOne?: ModalOption | null;
      optionTwo?: ModalOption | null;
      optionThree?: ModalOption | null;
      /** Escape / tapping outside. Default: option two (the "cancel"/"no" button of most dialogs). */
      dismiss?: (() => void) | null;
    }>(),
    {
      optionOne: null,
      optionTwo: null,
      optionThree: null,
      dismiss: null,
    }
);

const card = ref<HTMLElement | null>(null)
let previouslyFocused: Element | null = null

function dismiss() {
  if (props.dismiss) props.dismiss()
  else (props.optionTwo ?? props.optionThree ?? props.optionOne)?.action()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    dismiss()
  }
}

onMounted(async () => {
  previouslyFocused = document.activeElement
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  card.value?.querySelector<HTMLElement>('button')?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div class="modal-overlay" @click.self="dismiss">
        <div ref="card" class="modal-card" role="dialog" aria-modal="true" :aria-label="title">
          <h3 v-if="title" class="modal-title">{{ title }}</h3>
          <p v-if="message" class="modal-message">{{ message }}</p>
          <slot />

          <div class="modal-actions">
            <ButtonComponent
                v-if="optionThree"
                :button-style="optionThree.style ?? 'default'"
                :button-text="optionThree.text"
                :disabled="optionThree.disabled"
                @click="optionThree.action"
            />
            <ButtonComponent
                v-if="optionOne"
                :button-style="optionOne.style ?? 'default'"
                :button-text="optionOne.text"
                :disabled="optionOne.disabled"
                @click="optionOne.action"
            />
            <ButtonComponent
                v-if="optionTwo"
                :button-style="optionTwo.style ?? 'primary'"
                :button-text="optionTwo.text"
                :disabled="optionTwo.disabled"
                @click="optionTwo.action"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  /* above Vuetify layout items (bottom navigation ≈ 1004) */
  z-index: 2400;
  backdrop-filter: blur(2px);
  padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
}

.modal-card {
  width: 380px;
  max-width: calc(100% - 32px);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  background: var(--primary-color-light, rgba(30, 47, 92, 0.04));
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  color: var(--background-color);
  font-family: 'Museo', sans-serif;
}

.modal-title {
  margin: 0 0 10px;
  font-size: 1.125rem;
  font-weight: 600;
}

.modal-message {
  margin: 0 0 20px;
  font-size: 0.875rem;
  line-height: 1.5;
  opacity: 0.9;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

/* Phones: full-width bottom sheet with large buttons */
@media (max-width: 599px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal-card {
    width: 100%;
    max-width: 100%;
    max-height: 90dvh;
    border-radius: 16px 16px 0 0;
    padding: 20px 16px calc(16px + var(--safe-bottom));
  }

  .modal-card::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.35);
    margin: -8px auto 14px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions :deep(.button) {
    width: 100%;
    min-height: 48px;
    font-size: 15px;
  }
}

/* Vue Fade & Scale Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card {
  transform: scale(0.92);
}

@media (max-width: 599px) {
  .modal-fade-enter-active .modal-card {
    transition: transform 0.25s ease-out;
  }
  .modal-fade-enter-from .modal-card {
    transform: translateY(40px);
  }
}
</style>
