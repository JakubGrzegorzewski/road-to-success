<script setup lang="ts">
import {onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import Cookies from 'js-cookie'
import {projectSubPage} from "@/scripts/helperFunctions.ts";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";

const { locale } = useI18n()
const currentLocale = ref(null)

const changeLocale = () => {
  const newLocale = currentLocale.value
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
  Cookies.set('locale', newLocale, { expires: 365 })
}

onMounted(() => {
  const savedLocale = localStorage.getItem('locale') || 'en'
  locale.value = savedLocale
  currentLocale.value = savedLocale
  Cookies.set('locale', savedLocale, { expires: 365 })
})

const langOptions = [
  { value: 'en', label: 'English' },
  { value: 'pl', label: 'Polski' }
]
</script>

<template>
  <nav>
    <router-link class="" :to="projectSubPage"><img class="nav-logo" src="../../assets/logo.svg" alt="logo"></router-link>

    <div class="selector-style">
      <DropDownSelectionComponent v-model="currentLocale" :options="langOptions" @update:modelValue="changeLocale"/>
    </div>
  </nav>
</template>

<style scoped>
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--primary-color);
    box-shadow: 0 10px 10px var(--shadow-light);
    padding: 0 20px;
  }

  .nav-logo {
    width: 64px;
  }

  .selector-style {
    display: flex;
    align-items: center;
    gap: 20px;
}
</style>