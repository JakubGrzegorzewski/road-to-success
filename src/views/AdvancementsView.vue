<script setup>
import SelectRankComponent from "@/components/Advancement/SelectRankComponent.vue";
import {ref, onMounted} from 'vue';
import {fetchGET} from "@/main.js";
import Cookies from 'js-cookie';

const userRanks = ref([]);
const userRanksInProgress = ref([]);

onMounted(() => {
  fetchGET(`/api/rankInProgress/user/${Cookies.get('userId')}`).then(data => {
    for (let rank of data) {
      userRanks.value.push(rank);
      fetchGET(`/api/rank/${rank.rankId}`).then(rankData => {
        userRanksInProgress.value.push(rankData);
      })
    }

  });
})
</script>

<template>
  <div class="all-ranks" v-if="userRanks">
    <SelectRankComponent
        v-if="userRanks.length > 0"
        v-for="rank in userRanks"
        :key="rank.id"
        :rankName="userRanksInProgress.find( r => r.id === rank.rankId)?.fullName || 'rank not found'"
        :rankImage="`@/assets/images/${userRanksInProgress.find( r => r.id === rank.rankId)?.shortName}.png`"
        :rankStatus="rank.status"
        @click="$router.push(`/Advancement/${rank.id}`)"
    >
    </SelectRankComponent>
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
    flex-wrap: wrap;
    gap: 40px;
    padding : 40px;
  }
</style>