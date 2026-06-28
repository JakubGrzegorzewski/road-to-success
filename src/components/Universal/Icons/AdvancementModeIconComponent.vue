<script setup lang="ts">
const show = defineModel()
const props = defineProps<{
  color: string,
}>();
</script>

<template>
  <div @click="show = !show" class="eye-icon" >
    <!-- eye-slash icon - without fix  -->
    <svg :style="'fill:'+color" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" v-if="!show">
      <!--!Font Awesome Free v7.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544L153.5 543.7C121.2 540.4 96 513.1 96 480L96 160C96 124.7 124.7 96 160 96L480 96zM160 384L160 480L288 480L288 384L160 384zM352 384L352 480L480 480L480 384L352 384zM160 320L288 320L288 224L160 224L160 320zM352 320L480 320L480 224L352 224L352 320z"/></svg>

    <!-- eye-slash icon - with fix  -->
    <svg :style="'fill:'+color" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" v-if="show">
      <!--!Font Awesome Free v7.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/></svg>  </div>

</template>

<style scoped>

</style>