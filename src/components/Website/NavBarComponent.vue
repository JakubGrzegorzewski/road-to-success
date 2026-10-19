<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import SyncStatusComponent from '@/components/Website/SyncStatusComponent.vue'
import { setLocale, type AppLocale } from '@/scripts/i18n'
import { useLayout } from '@/scripts/composables'

const { t, locale } = useI18n()
const route = useRoute()
const { isMobile } = useLayout()

const langOptions: { value: AppLocale; label: string }[] = [
  { value: 'pl', label: 'Polski' },
  { value: 'en', label: 'English' },
]

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (value) => setLocale(value),
})

const links = computed(() => [
  { to: '/', label: t('nav.advancements'), active: ['Home', 'Advancement', 'AddPerson'].includes(String(route.name)) },
  { to: '/synchronizacja', label: t('nav.sync'), active: ['Sync', 'JoinRoom'].includes(String(route.name)) },
  { to: '/ustawienia', label: t('nav.settings'), active: route.name === 'Settings' },
])
</script>

<template>
  <nav class="nav" :class="{ mobile: isMobile }" :aria-label="t('app.name')">
    <router-link class="brand" to="/" :aria-label="t('nav.home')">
      <img class="nav-logo" src="../../assets/logo.svg" alt="">
      <span v-if="isMobile" class="brand-name">{{ t('app.name') }}</span>
    </router-link>

    <ul v-if="!isMobile" class="links">
      <li v-for="link in links" :key="link.to">
        <router-link :to="link.to" class="link" :class="{ active: link.active }" :aria-current="link.active ? 'page' : undefined">
          {{ link.label }}
        </router-link>
      </li>
    </ul>

    <div class="right">
      <SyncStatusComponent :compact="isMobile" />
      <div v-if="!isMobile" class="selector-style">
        <DropDownSelectionComponent v-model="currentLocale" :options="langOptions" styles="width: 140px" />
      </div>
    </div>
  </nav>
</template>

<style scoped>
  .nav {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: var(--space-md);
    background-color: var(--primary-color);
    box-shadow: 0 10px 10px var(--shadow-light);
    padding: 0 var(--space-md);
    padding-top: var(--safe-top);
    padding-left: calc(var(--space-md) + var(--safe-left));
    padding-right: calc(var(--space-md) + var(--safe-right));
    min-height: 64px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    text-decoration: none;
    font-family: 'Museo', sans-serif;
    font-weight: 700;
  }

  .nav-logo {
    width: 64px;
    max-width: 100%;
  }

  .links {
    display: flex;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .link {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-family: 'Museo', sans-serif;
    font-size: 15px;
  }

  .link:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .link.active {
    color: white;
    background: rgba(50, 158, 213, 0.25);
    box-shadow: inset 0 -3px 0 var(--secondary-color);
  }

  .right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .selector-style {
    display: flex;
    align-items: center;
  }

  /* Phones: slim top bar (navigation moves to the bottom bar) */
  .nav.mobile {
    min-height: 52px;
    gap: var(--space-xs);
    padding-left: calc(var(--space-sm) + var(--safe-left));
    padding-right: calc(var(--space-sm) + var(--safe-right));
  }

  .nav.mobile .nav-logo {
    width: 36px;
  }

  .nav.mobile .brand-name {
    font-size: 15px;
    white-space: nowrap;
  }

  .nav.mobile .right {
    flex: 1 1 auto;
    justify-content: flex-end;
  }
</style>
