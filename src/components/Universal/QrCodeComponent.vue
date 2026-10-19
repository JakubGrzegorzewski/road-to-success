<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ value: string; size?: number; alt?: string }>(), { size: 240, alt: '' })

const src = ref('')
const failed = ref(false)

watch(
    () => props.value,
    async (value) => {
      failed.value = false
      try {
        const QRCode = (await import('qrcode')).default
        src.value = await QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 2, width: props.size * 2 })
      } catch (e) {
        console.error('[qr]', e)
        failed.value = true
      }
    },
    { immediate: true },
)
</script>

<template>
  <img v-if="src && !failed" :src="src" :width="size" :height="size" :alt="alt" class="qr" />
</template>

<style scoped>
.qr {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  background: white;
  image-rendering: pixelated;
}
</style>
