<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const changeLocale = () => {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
}
</script>

<template>
  <nav>
    <img class="nav-logo" src="../assets/logo.svg" alt="logo">
    <div class="nav-buttons">
      <router-link class="btn-primary btn" to="/">{{ $t('nav.home') }}</router-link>
      <router-link class="btn-primary btn" to="/Advancements">{{ $t('nav.myAdvancement') }}</router-link>
      <router-link class="btn-primary btn" to="/menteesAdvancements">{{ $t('nav.menteesAdvancements') }}</router-link>
      <div class="language-select">
        <select @change="changeLocale" v-model="currentLocale">
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav{
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--primary-color-dark);
  box-shadow: 0 10px 10px var(--shadow-light);
}

.nav-logo{
  margin-left: 32px;
  width: 64px;
}
.nav-buttons{
  display: flex;
  align-items: center;
  gap: 16px;
}

.language-select {
  position: relative;
  display: inline-block;
}

.language-select select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background:white;
  border: 2px solid lightgray;
  border-radius: 8px;
  padding: 8px 32px 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--primary-color-dark);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.language-select::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--primary-color-dark);
  pointer-events: none;
  transition: transform 0.3s ease;
}

.language-select:hover select {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px var(--shadow-light);
}

.language-select:hover::after {
  border-top-color: var(--primary-color);
}

.language-select select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-dark), 0.1);
}

.language-select select:active::after {
  transform: translateY(-50%) rotate(180deg);
}
</style>