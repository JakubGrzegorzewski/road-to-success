<script setup>
import SelectRankComponent from "@/components/Advancement/SelectRankComponent.vue";
import {ref, onMounted} from 'vue';
import {fetchGET} from "@/main.js";

const ranks = ref([]);
const allRanks = ref([]);

onMounted(() => {
  fetchGET('/api/rank/user/123').then(data => ranks.value = data);
  fetchGET('/api/ranks').then(data => allRanks.value = data);
})
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