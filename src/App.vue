<script setup lang="ts">
import Cookies from 'js-cookie';
import {onMounted, ref} from 'vue';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import NavBarComponent from "@/components/Website/NavBarComponent.vue";
import FooterComponent from "@/components/Website/FooterComponent.vue";

onMounted(() => {
  if (!Cookies.get('locale')) {
    Cookies.set('locale', 'pl', { expires: 365 });
  }
  if (!Cookies.get('userId')) {
    Cookies.set('userId', '1', { expires: 1 });
  }
})

const isPopupShown = ref(false)
const popupTitle = ref('')
const popupMessage = ref('')

function showPopup(title: string, content: string) {
  isPopupShown.value = true;
  popupTitle.value = title;
  popupMessage.value = content;
}
</script>

<template>
  <div class="app-container">
    <nav-bar-component/>
    <main class="main-content">
      <router-view @showPopup="showPopup"/>
    </main>
    <footer-component/>
  </div>
  <div v-if="isPopupShown" style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.36); z-index: 1000;">
    <div style="width: 360px; max-width: calc(100% - 32px); background: var(--primary-color-light, rgba(30,47,92,0.04)); padding: 18px; border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); color: var(--background-color); font-family: 'Museo', sans-serif;">
      <h3 style="margin: 0 0 12px; font-size: 1rem; font-weight: 600;">{{ popupTitle }}</h3>
      <div style="margin-bottom: 18px; font-size: 0.875rem; line-height: 1.4;">{{ popupMessage }}</div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button-component buttonStyle="primary" @click="isPopupShown = false" :button-text="$t('info.close')" />
      </div>
    </div>
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