<script setup>
import NavBarComponent from "@/components/Website/NavBarComponent.vue";
import Cookies from 'js-cookie';
import { onMounted } from 'vue';
import FooterComponent from "@/components/Website/FooterComponent.vue";

onMounted(() => {
  if (!Cookies.get('locale')) {
    Cookies.set('locale', 'pl', { expires: 365 });
  }
  if (!Cookies.get('userId')) {
    Cookies.set('userId', '1', { expires: 1 });
  }
})
</script>

<template>
  <div class="app-container">
    <nav-bar-component></nav-bar-component>
    <main class="main-content">
      <router-view />
    </main>
    <footer-component/>
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