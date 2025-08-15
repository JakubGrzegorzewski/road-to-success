<script setup>
import {onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import Cookies from 'js-cookie'

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
</script>

<template>
  <nav>
    <router-link class="" to="/"><img class="nav-logo" src="../../assets/logo.svg" alt="logo"></router-link>

    <div class="nav-buttons">
      <div class="text-selection-component">
        <select @change="changeLocale" v-model="currentLocale">
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </div>
    </div>
  </nav>
</template>

<style scoped>
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--primary-color-dark);
    box-shadow: 0 10px 10px var(--shadow-light);
    padding: 0 20px;
  }

  .nav-logo {
    width: 64px;
  }

  .nav-buttons {
    display: flex;
    align-items: center;
    gap: 20px;
}
</style>