<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Cookies from 'js-cookie'

const { locale } = useI18n()
const currentLocale = ref(Cookies.get('locale') || 'pl')

const changeLocale = () => {
  const newLocale = currentLocale.value
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
  Cookies.set('locale', newLocale, { expires: 365 })
}
</script>

<template>
  <nav>
    <img class="nav-logo" src="../../assets/logo.svg" alt="logo">
    <div class="nav-buttons">
      <router-link class="btn-primary btn" to="/">{{ $t('nav.home') }}</router-link>
      <router-link class="btn-primary btn" to="/Advancements">{{ $t('nav.myAdvancement') }}</router-link>
      <router-link class="btn-primary btn" to="/menteesAdvancements">{{ $t('nav.menteesAdvancements') }}</router-link>
      <div class="language-select text-selection-component">
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