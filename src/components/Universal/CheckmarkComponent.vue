<script setup>
import {ref} from "vue";

const props = defineProps({
  buttonText: { type: String, required: false },
  buttonStyle: { type: String, default: 'default' },
})
const isCheckedVar = defineModel('isChecked', { default: false });</script>

<template>
  <div :class="[props.buttonStyle, 'button']" @click="isCheckedVar = !isCheckedVar; $emit('toggle', isCheckedVar)">
    <input type="checkbox" v-model="isCheckedVar"/>
    <span v-if="buttonText" style="max-width: 150px">{{ props.buttonText }}</span>
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
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  white-space: wrap;
  font-family: 'Museo', sans-serif;
  width: fit-content;
  flex-direction: row;
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
.white {
  background-color: white;
  color: var(--primary-color-dark);
}
</style>