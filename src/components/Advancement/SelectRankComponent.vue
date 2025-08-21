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
  },
  rankOwner: {
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
    case 'draft':
      color += 'var(--accent-warning)';
      return color
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
    <div class="rank-naming">
      <h3 class="rank-name">{{ rankName }}</h3>
      <h3 v-if="props.rankOwner"
          class="rank-status"
          style="color:var(--primary-color-dark);">
        {{ rankOwner }}
      </h3>
      <h3 v-if="props.rankStatus"
          class="rank-status"
          :style="selectColor(props.rankStatus.toLowerCase())">
        {{ $t(`statusOptions.${props.rankStatus.toLowerCase()}`) }}
      </h3>

    </div>
  </div>
</template>

<style scoped>
  .rank-image {
    max-width: 64px;
    max-height: 64px;
    object-fit: contain;
  }
  .rank-name {
    font-size: 1.5em;
    text-align: center;
    font-family: "Museo", sans-serif;
    margin: 0;
  }
  .rank-component {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-radius: 20px;
    box-shadow: 0 2px 8px var(--shadow-light);
  }

  .rank-status {
    font-size: 1em;
    text-align: center;
    font-family: "Museo", sans-serif;
    margin: 0;
  }

  .rank-naming {
    margin: 0px 20px;
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
  }

</style>