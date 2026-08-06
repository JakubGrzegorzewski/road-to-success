<script setup lang="ts">
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

interface ModalOption {
  text: string;
  action: () => void;
}

withDefaults(
    defineProps<{
      title: string;
      message?: string;
      optionOne?: ModalOption | null;
      optionTwo?: ModalOption | null;
    }>(),
    {
      optionOne: null,
      optionTwo: null,
    }
);
</script>

<template>
  <Transition name="modal-fade" appear>
    <div class="modal-overlay" @click.self="optionOne?.action || optionTwo?.action">
      <div class="modal-card" role="dialog" aria-modal="true">
        <h3 v-if="title" class="modal-title">{{ title }}</h3>
        <p v-if="message" class="modal-message">{{ message }}</p>

        <div class="modal-actions">
          <ButtonComponent
              v-if="optionOne"
              buttonStyle="secondary"
              :button-text="optionOne.text"
              @click="optionOne.action"
          />
          <ButtonComponent
              v-if="optionTwo"
              buttonStyle="primary"
              :button-text="optionTwo.text"
              @click="optionTwo.action"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4); /* Slightly darkened for better contrast */
  z-index: 1000;
  backdrop-filter: blur(2px); /* Premium, modern feel */
}

.modal-card {
  width: 360px;
  max-width: calc(100% - 32px);
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
  gap: 10px;
}

/* Vue Fade & Scale Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); /* Snappy bounce effect */
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card {
  transform: scale(0.92);
}
</style>