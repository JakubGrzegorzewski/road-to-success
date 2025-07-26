<script setup lang="ts">

const props = defineProps({
  buttonText: {
    type: String,
    required: true
  },
  buttonStyle: {
    type: String,
    default: 'default'
  }
})

</script>

<template>
  <div
      :class="props.buttonStyle"
      class="button"
  >
    <span> {{ props.buttonText }} </span>
  </div>
</template>

<style scoped>
.button {
  color: white;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
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
  background-color: var(--primary-color-dark);
}

.primary {
  background-color: var(--primary-color);
}

.success {
  background-color: var(--accent-success);
}

.warning {
  background-color: var(--accent-warning);
}

.error {
  background-color: var(--accent-error);
}

.info {
  background-color: var(--accent-info);
}


</style>