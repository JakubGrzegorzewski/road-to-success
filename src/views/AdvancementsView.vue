<script setup>
import SelectRankComponent from "@/components/Advancement/SelectRankComponent.vue";
import {ref, onMounted} from 'vue';
import {fetchGET} from "@/main.js";

const userRanks = ref([]);

onMounted(() => {
  fetchGET('/api/rankInProgress/user/1').then(data => {
    userRanks.value = data;
    console.log(data);
  });
})
</script>

<template>
  <div class="all-ranks" v-if="userRanks">
    <SelectRankComponent
        v-for="rank in userRanks"
        :key="rank.id"
        :rankName="rank.rank.fullName || 'rank not found'"
        :rankImage="`@/assets/images/${rank.rank.shortName}.png`"
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
    gap: 20px;
    padding : 20px;
  }
</style>