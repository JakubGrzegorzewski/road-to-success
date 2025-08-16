<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const props = defineProps({
  title: {
    type: String,
    default: 'Full Page Selector'
  },
  options: {
    type: Array,
    default: () => ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5']
  }
});

const selectedOption = ref(props.options[0]);

onMounted(() => {
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.body.style.overflow = '';
});

const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    $emit('close');
  }
};
</script>

<template>
  <div
      class="full-page-selector-component"
      v-if="props.options.length > 0 && props.title"
      @click="handleBackdropClick"
  >
    <div class="modal-content" @click.stop>

      <div @click="$emit('close')"
           style="align-self: flex-end; cursor: pointer;"
           class="close-button">
        x
      </div>

      <h1>{{ props.title }}</h1>
      <select v-model="selectedOption" class="selector">
        <option v-for="(option, index) in props.options" :key="index" :value="option">
          {{ option }}
        </option>
      </select>
      <button-component
          :button-text="$t('edit.save')"
          button-style="success"
          @click="$emit('close'); $emit('option-selected', selectedOption)"
      />
    </div>
  </div>
</template>

<style scoped>
.full-page-selector-component {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: 'Museo', sans-serif;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  position: relative;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  cursor: pointer;
  color: white;
  font-size: 18px;
  font-weight: bold;
  background: var(--primary-color-dark);
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>
