<script setup lang="ts">
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";



const props = defineProps<{
  title: string,
  message: string,
  optionOne : { text: string, action: () => void } | null,
  optionTwo : { text: string, action: () => void } | null,
}>();

</script>

<template>
  <div style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.36); z-index: 1000;">
    <div style="width: 360px; max-width: calc(100% - 32px); background: var(--primary-color-light, rgba(30,47,92,0.04)); padding: 18px; border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); color: var(--background-color); font-family: 'Museo', sans-serif;">
      <h3 style="margin: 0 0 12px; font-size: 1rem; font-weight: 600;" v-if="title">{{ title }}</h3>
      <div style="margin-bottom: 18px; font-size: 0.875rem; line-height: 1.4;" v-if="message">{{ message }}</div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button-component v-if="optionOne" buttonStyle="primary" :button-text="optionOne?.text" @click="optionOne?.action()"/>
        <button-component v-if="optionTwo" buttonStyle="primary" :button-text="optionTwo?.text" @click="optionTwo?.action()"/>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>