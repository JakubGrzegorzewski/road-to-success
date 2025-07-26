<script setup>
import { ref } from 'vue'
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
</style>