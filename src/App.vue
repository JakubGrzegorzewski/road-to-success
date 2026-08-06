<script setup lang="ts">
import NavBarComponent from "@/components/Website/NavBarComponent.vue";
import FooterComponent from "@/components/Website/FooterComponent.vue";
import { useFavicon } from '@vueuse/core'

const icon = useFavicon()

icon.value = '@/assets/favicon.ico'

import {onMounted} from 'vue';
import { db } from './scripts/db';
import defaultRanks from '@/assets/json/rank.json';
import defaultRequirements from '@/assets/json/requirements.json';
import {Rank} from "@/scripts/database/Rank.ts";

onMounted(async () => {
  const ranks = await Rank.getAll();
  if (ranks.length === 0) {
    await db.ranks.bulkPut(defaultRanks);
    await db.requirements.bulkPut(defaultRequirements);
  }
});
</script>

<template>
  <div class="app-container">
    <NavBarComponent class="app-bar" />
    <main class="main-content">
      <router-view/>
    </main>
    <FooterComponent class="footer" />
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

@media print {
  .app-bar, .footer {
    display: none;
  }
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