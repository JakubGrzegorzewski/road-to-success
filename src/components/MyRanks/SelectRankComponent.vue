<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  rankName: {
    type: String,
    required: true
  },
  rankImage: {
    type: String,
  },
})

const resolvedImageSrc = computed(() => {
  if (props.rankImage) {
    return new URL(props.rankImage.replace('@', '../..'), import.meta.url).href
  }
  return ''
})
</script>

<template>
  <div class="rank-component">
    <img :src="resolvedImageSrc" class="rank-image" :alt="rankName">
    <h2 class="rank-name">{{ rankName }}</h2>
  </div>
</template>

<style scoped>

.rank-image {
  max-width: 100px;
  max-height: 100px;
  object-fit: contain;
}
.rank-name {
  font-size: 1.5em;
  text-align: center;
  font-family: "Museo", sans-serif;
}
.rank-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px var(--shadow-light);
  width: 200px;
  height: 250px;

}
</style>