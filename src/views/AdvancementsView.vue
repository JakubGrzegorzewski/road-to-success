<script setup>
import SelectRankComponent from "@/components/MyRanks/SelectRankComponent.vue";
import {ref, onMounted} from 'vue';

const ranks = ref([]);
const error = ref(null);

onMounted(() => {
  fetch(`/api/rank/user/${123}`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
    }
  })
      .then(async response => {
        if (response.status === 403) {
          throw new Error('Access forbidden - check authentication');
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        ranks.value = await response.json();
      })
      .catch(err => {
        console.error('Error fetching ranks:', err);
        error.value = err.message;
        ranks.value = null;
      });
})

</script>

<template>
  <div class="all-ranks">
    <SelectRankComponent
        v-for="rank in ranks"
        :key="rank.rank"
        :rankName="rank.rank"
        :rankImage="`@/assets/images/${rank.rank}.png`"
        @click="$router.push(`/Advancement/${rank.id}`)"
    />
    <SelectRankComponent
        rankName="Create New Rank"
        rankImage="@/assets/images/plus.png"
        @click="$router.push('/CreateAdvancement')"
    />
  </div>
</template>

<style scoped>
  .all-ranks {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 20px;
    padding : 20px;
  }
</style>