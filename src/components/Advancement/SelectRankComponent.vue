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
  rankStatus: {
    type: String,
    required: false,
  }
})

const resolvedImageSrc = computed(() => {
  if (props.rankImage) {
    return new URL(props.rankImage.replace('@', '../..'), import.meta.url).href
  }
  return ''
})

function selectColor(status) {
  let color = 'color: '
  switch (status) {
    case 'creation':
      color += 'var(--primary-color-dark)';
      return color
    case 'pending':
      color += 'var(--accent-warning)';
      return color
    case 'inProgress':
      color += 'var(--accent-info)';
      return color
    case 'completed':
      color += 'var(--accent-success)';
      return color
    case 'failed':
      color += 'var(--accent-error)';
      return color
    default:
      color += 'var(--primary-color-dark)';
      return color;
  }
}
</script>

<template>
  <div class="rank-component">
    <img :src="resolvedImageSrc" class="rank-image" :alt="rankName">
    <h2 class="rank-name">{{ rankName }}</h2>
    <h3 v-if="props.rankStatus" class="rank-status" :style="selectColor(props.rankStatus)"> {{ $t(`advancement.statusOptions.${props.rankStatus.toLowerCase()}`) }} </h3>
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
  margin: 20px 0 0 0;
}
.rank-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px var(--shadow-light);
  width: 200px;
  height: 250px;
}
.rank-status {
  font-size: 1em;
  text-align: center;
  font-family: "Museo", sans-serif;
  margin: 0;
}
</style>