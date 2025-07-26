<script setup>
import SelectRankComponent from "@/components/Advancement/SelectRankComponent.vue";
import {ref, onMounted} from 'vue';

const ranks = ref([]);
const allRanks = ref([]);
const error = ref(null);

onMounted(() => {
  fetchUserRanks(123);
  fetchAllRanks();
})

async function fetchUserRanks(id) {
  fetch(`/api/rank/user/${id}`, {
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
        console.log(ranks.value);
      })
      .catch(err => {
        console.error('Error fetching ranks:', err);
        error.value = err.message;
        ranks.value = null;
      });
}

async function fetchAllRanks() {
  fetch("/api/ranks", {
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
        allRanks.value = await response.json();
      })
      .catch(err => {
        console.error('Error fetching all ranks:', err);
        error.value = err.message;
        allRanks.value = null;
      });
}

</script>

<template>
  <div class="all-ranks" v-if="allRanks && ranks">
    <SelectRankComponent
        v-for="rank in ranks"
        :key="rank.rank"
        :rankName="allRanks.find(element => element.rank_short === rank.rank)?.rank_name_full || 'rank not found'"
        :rankImage="`@/assets/images/${rank.rank}.png`"
        :rankStatus="rank.status"
        @click="$router.push(`/Advancement/${rank.id}`)"
    />
    <SelectRankComponent
        :rankName="$t('advancement.add')"
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