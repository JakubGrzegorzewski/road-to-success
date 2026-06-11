<script setup lang="ts">
import NavBarComponent from "@/components/Website/NavBarComponent.vue";
import FooterComponent from "@/components/Website/FooterComponent.vue";
import { useFavicon } from '@vueuse/core'

const icon = useFavicon()

icon.value = '@/assets/favicon.ico'


</script>

<template>
  <div class="app-container">
    <NavBarComponent/>
    <main class="main-content">
      <router-view/>
    </main>
    <FooterComponent/>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}
</style>

<style>
@import url('assets/css/default.css');
@import url('assets/css/custom_components.css');

body {
  margin: 0;
  padding: 0;
  @media (prefers-color-scheme: dark) {
    color: var(--background-color);
    background: var(--primary-color);
  }
  @media (prefers-color-scheme: light) {
    color: var(--primary-color);
    background: var(--background-color);
  }
}
</style>