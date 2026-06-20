<script setup lang="ts">
import NavBarComponent from "@/components/Website/NavBarComponent.vue";
import FooterComponent from "@/components/Website/FooterComponent.vue";
import { useFavicon } from '@vueuse/core'

const icon = useFavicon()

icon.value = '@/assets/favicon.ico'

import { onMounted } from 'vue';
import { db } from './scripts/db';
import defaultRanks from '@/assets/json/rank.json';
import {Rank} from "@/scripts/Model/Rank.ts"; // Adjust if you have starter ranks

onMounted(async () => {
  // Check if ranks table is empty
  const count = await db.ranks.count();
  console.log("Database count:", count);
  for (const rank of await Rank.getAll()){
    console.log("Rank:", rank)

  }
  if (count === 0) {
    console.log("Database is empty. Seeding initial data...");

    // Use bulkPut for high-performance batch initialization
    await db.ranks.bulkPut(defaultRanks);

    // Add a default user if none exists
    await db.users.put({
      id: 0,
      fullName: "Default User",
      ranksInProgressIds: [],
      mentorRanksInProgressIds: [],
      commentIds: []
    });
  }
});
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